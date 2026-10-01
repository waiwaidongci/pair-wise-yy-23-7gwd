import type { BrailleSymbol, BrailleSymbolVersion, SymbolSnapshot } from "../types/BrailleSymbol";
import type { PracticeSession } from "../types/PracticeSession";
import type { AnswerRecord } from "../types/AnswerRecord";
import {
  INITIAL_VERSION,
  REPRACTICE_REASON,
  SYSTEM_TEACHER,
  BACKFILL_NOTE
} from "../constants/versioning";

// ---- 旧数据兼容与回填 ----

// 旧卡片没有 versions/current_version：用扁平字段回填首次内容（v1）。
export function backfillSymbol(raw: BrailleSymbol): BrailleSymbol {
  const symbol: BrailleSymbol = { ...raw };
  if (!Array.isArray(symbol.versions) || symbol.versions.length === 0) {
    const version: BrailleSymbolVersion = {
      version: INITIAL_VERSION,
      cell_pattern: symbol.cell_pattern,
      letter: symbol.letter,
      pinyin: symbol.pinyin,
      category: symbol.category,
      difficulty: symbol.difficulty,
      audio_hint_key: symbol.audio_hint_key,
      updated_by: SYSTEM_TEACHER,
      updated_at: new Date(0).toISOString(),
      change_note: BACKFILL_NOTE
    };
    symbol.versions = [version];
  }
  if (typeof symbol.current_version !== "number" || symbol.current_version < INITIAL_VERSION) {
    symbol.current_version = symbol.versions[symbol.versions.length - 1]?.version ?? INITIAL_VERSION;
  }
  // 扁平字段对齐当前版本，避免旧读取方拿到与 versions 不一致的值。
  const head = getCurrentVersionEntry(symbol);
  if (head) {
    symbol.cell_pattern = head.cell_pattern;
    symbol.letter = head.letter;
    symbol.pinyin = head.pinyin;
    symbol.category = head.category;
    symbol.difficulty = head.difficulty;
    symbol.audio_hint_key = head.audio_hint_key;
  }
  return symbol;
}

// 旧会话没有开考快照：按当前卡片内容兜底生成，并标记回填。
export function backfillSession(
  raw: PracticeSession,
  symbols: BrailleSymbol[],
  lessons: { id: number; symbol_ids: number[] }[] = []
): PracticeSession {
  const session: PracticeSession = { ...raw };
  if (!Array.isArray(session.symbol_snapshot) || session.symbol_snapshot.length === 0) {
    // 旧会话只关联 lesson：用课程关联的卡片补快照，找不到课程时退化为全部卡片。
    const lesson = lessons.find((item) => item.id === session.lesson_id);
    const lessonSymbolIds = lesson?.symbol_ids ?? symbols.map((s) => s.id);
    session.symbol_snapshot = lessonSymbolIds.map((id) => buildSnapshot(findSymbol(symbols, id)));
    session.backfilled = true;
  }
  if (!session.status) {
    session.status = session.finished_at ? "finished" : "in_progress";
  }
  return session;
}

// 旧答题记录没有版本信息：按该卡片当前版本补快照，保证“当时内容”可解释。
export function backfillAnswerRecord(raw: AnswerRecord, symbols: BrailleSymbol[]): AnswerRecord {
  const record: AnswerRecord = { ...raw };
  if (typeof record.symbol_version !== "number" || record.symbol_version < INITIAL_VERSION) {
    const symbol = findSymbol(symbols, record.symbol_id);
    record.symbol_version = symbol?.current_version ?? INITIAL_VERSION;
    record.symbol_snapshot = buildSnapshot(symbol);
    record.backfilled = true;
  }
  if (!record.symbol_snapshot) {
    const symbol = findSymbol(symbols, record.symbol_id);
    record.symbol_snapshot = buildSnapshot(symbol);
  }
  return record;
}

// ---- 版本读取 ----

export function getCurrentVersionEntry(symbol: BrailleSymbol): BrailleSymbolVersion | undefined {
  if (!Array.isArray(symbol.versions) || symbol.versions.length === 0) return undefined;
  return (
    symbol.versions.find((v) => v.version === symbol.current_version) ??
    symbol.versions[symbol.versions.length - 1]
  );
}

export function getVersionEntry(
  symbol: BrailleSymbol,
  version: number
): BrailleSymbolVersion | undefined {
  return symbol.versions?.find((v) => v.version === version);
}

export function nextVersionNumber(symbol: BrailleSymbol): number {
  const max = symbol.versions?.reduce((acc, v) => Math.max(acc, v.version), 0) ?? 0;
  return Math.max(symbol.current_version ?? 0, max) + 1;
}

// ---- 快照 ----

export function buildSnapshot(symbol: BrailleSymbol | undefined): SymbolSnapshot {
  if (!symbol) {
    return { symbol_id: 0, version: 0, cell_pattern: "", letter: "", pinyin: "" };
  }
  const head = getCurrentVersionEntry(symbol);
  return {
    symbol_id: symbol.id,
    version: symbol.current_version,
    cell_pattern: head?.cell_pattern ?? symbol.cell_pattern,
    letter: head?.letter ?? symbol.letter,
    pinyin: head?.pinyin ?? symbol.pinyin
  };
}

// 会话快照是否已落后于卡片当前版本。
export function isSnapshotStale(snapshot: SymbolSnapshot, symbol: BrailleSymbol): boolean {
  return snapshot.symbol_id === symbol.id && snapshot.version !== symbol.current_version;
}

// ---- 重算 ----

// 重算会话：找出开考快照与当前字形不一致的卡片，返回受影响卡片 id 与原因。
export function recalculateSession(
  session: PracticeSession,
  symbols: BrailleSymbol[]
): { affectedSymbolIds: number[]; reason: string } {
  const affectedSymbolIds: number[] = [];
  for (const snapshot of session.symbol_snapshot ?? []) {
    const symbol = findSymbol(symbols, snapshot.symbol_id);
    if (symbol && isSnapshotStale(snapshot, symbol)) {
      affectedSymbolIds.push(symbol.id);
    }
  }
  const reason =
    affectedSymbolIds.length > 0
      ? REPRACTICE_REASON.CARD_UPDATED
      : REPRACTICE_REASON.SNAPSHOT_STALE;
  return { affectedSymbolIds, reason };
}

// ---- 差异 ----

export const CARD_FIELDS: (keyof BrailleSymbolVersion)[] = [
  "cell_pattern",
  "letter",
  "pinyin",
  "category",
  "difficulty",
  "audio_hint_key"
];

export function diffVersionFields(
  prev: BrailleSymbolVersion,
  next: BrailleSymbolVersion
): string[] {
  return CARD_FIELDS.filter((field) => prev[field] !== next[field]);
}

// ---- 内部工具 ----

function findSymbol(symbols: BrailleSymbol[], id: number): BrailleSymbol | undefined {
  return symbols.find((s) => s.id === id);
}
