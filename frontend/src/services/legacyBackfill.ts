import { createLegacyBrailleSymbolVersion } from "../constructors/BrailleSymbolVersionConstructor";
import { snapshotFromVersion } from "../utils/versioning";
import { log } from "../utils/logger";
import { recalculateLessonsForVersions } from "./lessonRecalculation";
import { commitBundle, type DataBundle } from "./dataRepository";
import type { AnswerRecord } from "../types/AnswerRecord";
import type { BrailleSymbol } from "../types/BrailleSymbol";
import type { BrailleSymbolVersion } from "../types/BrailleSymbolVersion";
import type { Lesson } from "../types/Lesson";
import type { PracticeSession } from "../types/PracticeSession";

export interface BackfillReport {
  symbolIds: number[];
  versionIds: string[];
  sessionIds: number[];
  recordIds: number[];
  lessonIds: number[];
  changed: boolean;
}

/**
 * 旧数据没有版本标识：首次加载时先兼容（页面不能崩），再回填“首次内容”为 v1。
 * 幂等：任何实体已经带版本字段都会跳过，可重复执行。
 * 回填顺序：卡片 -> 会话快照 -> 答题记录快照 -> 课程重算（旧课程若有未完成会话也会标待重练）。
 */
export async function backfillLegacyData(bundle: DataBundle): Promise<BackfillReport> {
  const report: BackfillReport = {
    symbolIds: [],
    versionIds: [],
    sessionIds: [],
    recordIds: [],
    lessonIds: [],
    changed: false
  };

  // 1. 卡片 -> 首个版本
  const newVersions: BrailleSymbolVersion[] = [];
  const patchedSymbols: BrailleSymbol[] = [];
  bundle.symbols.forEach((symbol) => {
    const existing = bundle.versions.find(
      (version) => version.symbol_id === symbol.id && version.version_no === 1
    );
    if (existing && symbol.current_version_id) return;

    const version =
      existing ??
      createLegacyBrailleSymbolVersion(
        symbol.id,
        {
          cell_pattern: symbol.cell_pattern,
          letter: symbol.letter,
          pinyin: symbol.pinyin,
          category: symbol.category,
          difficulty: symbol.difficulty,
          audio_hint_key: symbol.audio_hint_key
        },
        "旧卡片首次内容"
      );
    if (!existing) newVersions.push(version);
    report.versionIds.push(version.id);
    report.symbolIds.push(symbol.id);
    patchedSymbols.push({
      ...symbol,
      current_version_id: version.id,
      current_version_no: 1,
      has_conflict: false
    });
  });

  const versionOf = (symbolId: number) =>
    [...bundle.versions, ...newVersions].find(
      (version) =>
        version.symbol_id === symbolId &&
        version.id ===
          (patchedSymbols.find((symbol) => symbol.id === symbolId)?.current_version_id ??
            bundle.symbols.find((symbol) => symbol.id === symbolId)?.current_version_id)
    );

  // 2. 会话：补状态、冻结快照、baseline
  const patchedSessions: PracticeSession[] = [];
  bundle.sessions.forEach((session) => {
    const lesson = bundle.lessons.find((row) => row.id === session.lesson_id);
    if (!lesson) return;
    const alreadyVersioned =
      Array.isArray(session.card_snapshots) && session.card_snapshots.length > 0;
    if (alreadyVersioned && session.status) return;

    const snapshots = lesson.symbol_ids
      .map((symbolId) => {
        const version = versionOf(symbolId);
        return version ? snapshotFromVersion(version) : null;
      })
      .filter((snapshot): snapshot is NonNullable<typeof snapshot> => snapshot !== null);

    report.sessionIds.push(session.id);
    patchedSessions.push({
      ...session,
      status: session.status ?? (session.finished_at ? "FINISHED" : "IN_PROGRESS"),
      score: typeof session.score === "number" ? session.score : Number(session.score) || 0,
      mistake_count:
        typeof session.mistake_count === "number"
          ? session.mistake_count
          : Number(session.mistake_count) || 0,
      card_snapshots: alreadyVersioned ? session.card_snapshots : snapshots,
      baseline_version_ids:
        session.baseline_version_ids && session.baseline_version_ids.length > 0
          ? session.baseline_version_ids
          : snapshots.map((snapshot) => snapshot.version_id),
      editor: session.editor ?? "legacy-user"
    });
  });

  // 3. 答题记录：补当时快照与 superseded
  const patchedRecords: AnswerRecord[] = [];
  bundle.records.forEach((record) => {
    if (record.card_snapshot) return;
    const session = bundle.sessions.find((row) => row.id === record.session_id);
    const frozen = session?.card_snapshots?.find(
      (snapshot) => snapshot.symbol_id === record.symbol_id
    );
    const version = versionOf(record.symbol_id);
    const snapshot = frozen ?? (version ? snapshotFromVersion(version) : null);
    if (!snapshot) return;

    const symbol = bundle.symbols.find((row) => row.id === record.symbol_id);
    report.recordIds.push(record.id);
    patchedRecords.push({
      ...record,
      correct: typeof record.correct === "boolean" ? record.correct : String(record.correct) === "true",
      latency_ms:
        typeof record.latency_ms === "number" ? record.latency_ms : Number(record.latency_ms) || 0,
      card_snapshot: snapshot,
      superseded: symbol ? symbol.current_version_id !== snapshot.version_id : false
    });
  });

  // 4. 课程：补重练字段，再按回填后的会话参与重算
  const patchedLessons: Lesson[] = [];
  bundle.lessons.forEach((lesson) => {
    if (lesson.needs_repractice !== undefined && Array.isArray(lesson.stale_version_ids)) return;
    report.lessonIds.push(lesson.id);
    patchedLessons.push({
      ...lesson,
      estimated_minutes:
        typeof lesson.estimated_minutes === "number"
          ? lesson.estimated_minutes
          : Number(lesson.estimated_minutes) || 0,
      needs_repractice: false,
      stale_version_ids: [],
      recalculated_at: null
    });
  });

  // 用回填后的数据包重算受影响旧课程（未完成会话引用的版本若已落后则标待重练）
  const hydratedBundle: DataBundle = {
    symbols: bundle.symbols.map(
      (symbol) => patchedSymbols.find((row) => row.id === symbol.id) ?? symbol
    ),
    versions: [...bundle.versions, ...newVersions],
    lessons: bundle.lessons.map(
      (lesson) => patchedLessons.find((row) => row.id === lesson.id) ?? lesson
    ),
    sessions: bundle.sessions.map(
      (session) => patchedSessions.find((row) => row.id === session.id) ?? session
    ),
    records: bundle.records
  };
  const affectedSymbols = new Set(patchedSymbols.map((symbol) => symbol.id));
  const recalculated: Lesson[] = [];
  affectedSymbols.forEach((symbolId) => {
    const { lessons } = recalculateLessonsForVersions(hydratedBundle, symbolId);
    lessons.forEach((lesson) => {
      if (!recalculated.some((row) => row.id === lesson.id)) recalculated.push(lesson);
    });
  });
  recalculated.forEach((lesson) => {
    if (!report.lessonIds.includes(lesson.id)) report.lessonIds.push(lesson.id);
  });

  // 合并课程补丁（避免重算结果被默认补丁覆盖）
  const finalLessons = mergeById([...patchedLessons, ...recalculated]);
  const finalSymbols = mergeById(patchedSymbols);
  const finalSessions = mergeById(patchedSessions);
  const finalRecords = mergeById(patchedRecords);
  report.changed =
    finalSymbols.length > 0 ||
    newVersions.length > 0 ||
    finalSessions.length > 0 ||
    finalRecords.length > 0 ||
    finalLessons.some((lesson) => lesson.needs_repractice);

  if (report.changed) {
    await commitBundle({
      symbols: finalSymbols,
      versions: newVersions,
      lessons: finalLessons,
      sessions: finalSessions,
      records: finalRecords
    });
    newVersions.forEach((version) =>
      log("BrailleSymbolVersion", 2, {
        symbolId: version.symbol_id,
        versionNo: 1,
        source: "legacy"
      })
    );
    finalRecords.forEach((record) =>
      log("AnswerRecord", 5, { recordId: record.id, symbolId: record.symbol_id })
    );
  }

  return report;
}

function mergeById<T extends { id: unknown }>(rows: T[]): T[] {
  const map = new Map<T["id"], T>();
  rows.forEach((row) => map.set(row.id, row));
  return [...map.values()];
}
