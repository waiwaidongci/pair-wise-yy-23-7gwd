import type { AnswerRecord } from "../types/AnswerRecord";
import type { BrailleSymbol } from "../types/BrailleSymbol";
import type { BrailleSymbolVersion, CardSnapshot } from "../types/BrailleSymbolVersion";
import type { DataBundle } from "../services/dataRepository";
import type { Lesson } from "../types/Lesson";
import type { PracticeSession } from "../types/PracticeSession";

export const versionsOfSymbol = (versions: BrailleSymbolVersion[], symbolId: number) =>
  versions
    .filter((version) => version.symbol_id === symbolId)
    .sort((a, b) => b.version_no - a.version_no);

export const currentVersion = (
  versions: BrailleSymbolVersion[],
  symbol: BrailleSymbol | undefined
): BrailleSymbolVersion | undefined =>
  versions.find((version) => version.id === symbol?.current_version_id);

export const findVersion = (
  versions: BrailleSymbolVersion[],
  versionId: string | null | undefined
): BrailleSymbolVersion | undefined =>
  versions.find((version) => version.id === versionId);

/** 会话某题当前应该显示的字形：永远是会话开始时冻结的版本 */
export const frozenSnapshot = (
  session: PracticeSession,
  questionIndex: number
): CardSnapshot | undefined => session.card_snapshots?.[questionIndex];

/** 该会话里是否仍有题目引用已被取代的旧字形（未做完会话据此提示“沿用旧卡片”） */
export const sessionUsesStaleGlyphs = (
  session: PracticeSession,
  bundle: Pick<DataBundle, "symbols">
): boolean =>
  (session.card_snapshots ?? []).some((snapshot) => {
    const symbol = bundle.symbols.find((row) => row.id === snapshot.symbol_id);
    return symbol && symbol.current_version_id !== snapshot.version_id;
  });

/** 已交卷记录解释用的字形：按当时内容（快照），不回退到当前卡片 */
export const recordSnapshot = (record: AnswerRecord): CardSnapshot | null =>
  record.card_snapshot ?? null;

export const isSupersededRecord = (
  record: AnswerRecord,
  symbols: BrailleSymbol[]
): boolean => {
  if (!record.card_snapshot) return false;
  const symbol = symbols.find((row) => row.id === record.symbol_id);
  return !!symbol && symbol.current_version_id !== record.card_snapshot.version_id;
};

export const lessonInProgressSessions = (
  sessions: PracticeSession[],
  lessonId: number
): PracticeSession[] =>
  sessions.filter(
    (session) => session.lesson_id === lessonId && session.status === "IN_PROGRESS"
  );

export const repracticeLessons = (lessons: Lesson[]): Lesson[] =>
  lessons.filter((lesson) => lesson.needs_repractice);

export const conflictingSymbols = (symbols: BrailleSymbol[]): BrailleSymbol[] =>
  symbols.filter((symbol) => symbol.has_conflict);

export const conflictVersionsOf = (
  versions: BrailleSymbolVersion[],
  symbolId: number
): BrailleSymbolVersion[] =>
  versionsOfSymbol(versions, symbolId).filter(
    (version) => version.status === "ACTIVE" || version.status === "CONFLICT"
  );

export const sessionRecords = (records: AnswerRecord[], sessionId: number): AnswerRecord[] =>
  records.filter((record) => record.session_id === sessionId);

export const mistakeRecords = (records: AnswerRecord[]): AnswerRecord[] =>
  records.filter((record) => !record.correct);
