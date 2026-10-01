import { savePracticeSession } from "../api/PracticeSession";
import { saveManyAnswerRecord } from "../api/AnswerRecord";
import { saveLesson } from "../api/Lesson";
import type { AnswerRecord } from "../types/AnswerRecord";
import type { CardSnapshot } from "../types/BrailleSymbolVersion";
import type { PracticeSession } from "../types/PracticeSession";
import { createDefaultAnswerRecord } from "../constructors/AnswerRecordConstructor";
import { createDefaultPracticeSession } from "../constructors/PracticeSessionConstructor";
import { nowIso, snapshotFromVersion } from "../utils/versioning";
import { ServiceError } from "../utils/ServiceError";
import { log } from "../utils/logger";
import { clearRepracticeIfRefreshed } from "./lessonRecalculation";
import type { DataBundle } from "./dataRepository";

export interface StartSessionInput {
  lessonId: number;
  mode: string;
  editor: string;
  bundle: DataBundle;
}

/**
 * 开始练习：题目内容在会话开始那一刻冻结。
 * 后续练习使用新字形（新会话总是取卡片当前版本）；
 * 已开始但没做完的会话继续按开始时的卡片出题，老师中途修正也不变。
 */
export function startPracticeSession(input: StartSessionInput): PracticeSession {
  const { lessonId, mode, editor, bundle } = input;
  const lesson = bundle.lessons.find((row) => row.id === lessonId);
  if (!lesson) {
    throw new ServiceError("VALIDATION_FAILED", { lessonId });
  }

  const snapshots: CardSnapshot[] = lesson.symbol_ids
    .map((symbolId) => {
      const symbol = bundle.symbols.find((row) => row.id === symbolId);
      const version = bundle.versions.find((row) => row.id === symbol?.current_version_id);
      if (!symbol || !version) return null;
      return snapshotFromVersion(version);
    })
    .filter((snapshot): snapshot is CardSnapshot => snapshot !== null);

  const nextId = bundle.sessions.reduce((max, session) => Math.max(max, session.id), 0) + 1;
  const session = createDefaultPracticeSession({
    id: nextId,
    lesson_id: lessonId,
    mode,
    started_at: nowIso(),
    finished_at: "",
    score: 0,
    mistake_count: 0,
    status: "IN_PROGRESS",
    card_snapshots: snapshots,
    baseline_version_ids: snapshots.map((snapshot) => snapshot.version_id),
    editor
  });
  log("PracticeSession", 4, { sessionId: nextId, versionIds: session.baseline_version_ids.join(",") });
  return session;
}

/** 取出某道题在会话开始时冻结的字形（未做完会话继续按旧卡片出题的关键入口） */
export function getFrozenQuestion(session: PracticeSession, index: number): CardSnapshot {
  const snapshot = session.card_snapshots[index];
  if (!snapshot) {
    throw new ServiceError("SNAPSHOT_MISSING", { sessionId: session.id, index });
  }
  return snapshot;
}

export interface GradeAnswerInput {
  session: PracticeSession;
  questionIndex: number;
  userAnswer: string;
  latencyMs: number;
  mistakeReason: string;
  bundle: DataBundle;
}

export interface GradeAnswerResult {
  record: AnswerRecord;
  superseded: boolean;
}

/**
 * 作答判分：题干永远取会话冻结快照；
 * 记录上额外标注 superseded（该题卡片后来已更新），
 * 错题本因此可以保留旧错误原因，同时说明它依据的是旧字形。
 */
export async function gradeAnswer(input: GradeAnswerInput): Promise<GradeAnswerResult> {
  const { session, questionIndex, userAnswer, latencyMs, mistakeReason, bundle } = input;
  const snapshot = getFrozenQuestion(session, questionIndex);
  const correct = normalizeAnswer(userAnswer) === normalizeAnswer(snapshot.letter);

  const current = bundle.symbols.find((symbol) => symbol.id === snapshot.symbol_id);
  const superseded = !!current && current.current_version_id !== snapshot.version_id;

  const nextId = bundle.records.reduce((max, record) => Math.max(max, record.id), 0) + 1;
  const record = createDefaultAnswerRecord({
    id: nextId,
    session_id: session.id,
    symbol_id: snapshot.symbol_id,
    user_answer: userAnswer,
    correct,
    latency_ms: latencyMs,
    mistake_reason: correct ? "" : mistakeReason,
    card_snapshot: snapshot,
    superseded
  });
  await saveManyAnswerRecord([record]);
  log("AnswerRecord", 4, {
    recordId: nextId,
    versionId: snapshot.version_id,
    superseded: superseded ? 1 : 0
  });
  return { record, superseded };
}

export interface FinishSessionInput {
  session: PracticeSession;
  records: AnswerRecord[];
  bundle: DataBundle;
}

/** 交卷：冻结分数；若本次用的是新字形且覆盖了课程全部旧版本，清除“待重练”标记 */
export async function finishPracticeSession(input: FinishSessionInput): Promise<PracticeSession> {
  const { session, records, bundle } = input;
  const sessionRecords = records.filter((record) => record.session_id === session.id);
  const total = session.card_snapshots.length || sessionRecords.length || 1;
  const correctCount = sessionRecords.filter((record) => record.correct).length;
  const mistakeCount = sessionRecords.filter((record) => !record.correct).length;
  const score = Math.round((correctCount / total) * 100);

  const finished: PracticeSession = {
    ...session,
    status: "FINISHED",
    finished_at: nowIso(),
    score,
    mistake_count: mistakeCount
  };
  await savePracticeSession(finished);

  // 只有本次会话用的是“卡片当前版本”（即新字形重练）才可能解除待重练；
  // 沿用旧字形的进行中会话交卷不应清除标记。
  const usesCurrentVersions = session.card_snapshots.every((snapshot) => {
    const symbol = bundle.symbols.find((row) => row.id === snapshot.symbol_id);
    return symbol?.current_version_id === snapshot.version_id;
  });
  if (usesCurrentVersions) {
    const freshVersionIds = [...new Set(session.card_snapshots.map((snapshot) => snapshot.version_id))];
    const clearedLesson = clearRepracticeIfRefreshed(bundle, session.lesson_id, freshVersionIds);
    if (clearedLesson && !clearedLesson.needs_repractice) {
      await saveLesson(clearedLesson);
    }
  }
  log("PracticeSession", 2, { sessionId: session.id });
  return finished;
}

/** 错题本/进度页解释单条记录时使用的字形：已交卷记录仍按当时内容解释 */
export function resolveRecordGlyph(record: AnswerRecord, bundle: DataBundle): CardSnapshot {
  if (record.card_snapshot) return record.card_snapshot;
  // 理论上回填后不会走到这里；兜底用版本表
  const fallback = bundle.versions
    .filter((version) => version.symbol_id === record.symbol_id)
    .sort((a, b) => a.version_no - b.version_no)[0];
  if (!fallback) {
    throw new ServiceError("SNAPSHOT_MISSING", { recordId: record.id, symbolId: record.symbol_id });
  }
  return snapshotFromVersion(fallback);
}

function normalizeAnswer(value: string): string {
  return value.trim().toLowerCase();
}
