import type { PracticeSession } from "../types/PracticeSession";
import type { BrailleSymbol, SymbolSnapshot } from "../types/BrailleSymbol";
import { SESSION_STATUS, SYSTEM_TEACHER } from "../constants/versioning";

// 按当前卡片（或指定版本）生成开考快照：会话期间题目锁定这份内容。
export const createSymbolSnapshot = (
  symbols: BrailleSymbol[],
  symbolIds: number[]
): SymbolSnapshot[] =>
  symbolIds.map((id) => {
    const symbol = symbols.find((item) => item.id === id);
    if (!symbol) {
      return {
        symbol_id: id,
        version: 0,
        cell_pattern: "",
        letter: "",
        pinyin: ""
      };
    }
    return {
      symbol_id: symbol.id,
      version: symbol.current_version,
      cell_pattern: symbol.cell_pattern,
      letter: symbol.letter,
      pinyin: symbol.pinyin
    };
  });

export const createDefaultPracticeSession = (
  overrides: Partial<PracticeSession> = {}
): PracticeSession => ({
  id: 0,
  lesson_id: 0,
  mode: "CELL_TO_TEXT",
  started_at: new Date(0).toISOString(),
  finished_at: "",
  score: 0,
  mistake_count: 0,
  status: SESSION_STATUS.IN_PROGRESS,
  symbol_snapshot: [],
  needs_repractice: false,
  repractice_reason: "",
  repractice_source_session_id: undefined,
  backfilled: false,
  ...overrides
});

export const createPracticeSessionForm = (overrides: Partial<PracticeSession> = {}) =>
  createDefaultPracticeSession(overrides);

export const createPracticeSessionResponse = (overrides: Partial<PracticeSession> = {}) =>
  createDefaultPracticeSession(overrides);

export { SYSTEM_TEACHER };
