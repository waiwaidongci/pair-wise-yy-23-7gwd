import type { AnswerRecord } from "../types/AnswerRecord";
import type { SymbolSnapshot } from "../types/BrailleSymbol";

export const createDefaultAnswerRecord = (overrides: Partial<AnswerRecord> = {}): AnswerRecord => ({
  id: 0,
  session_id: 0,
  symbol_id: 0,
  user_answer: "",
  correct: "false",
  latency_ms: "0",
  mistake_reason: "",
  symbol_version: 0,
  symbol_snapshot: {
    symbol_id: 0,
    version: 0,
    cell_pattern: "",
    letter: "",
    pinyin: ""
  } as SymbolSnapshot,
  backfilled: false,
  ...overrides
});

export const createAnswerRecordForm = (overrides: Partial<AnswerRecord> = {}) =>
  createDefaultAnswerRecord(overrides);

export const createAnswerRecordResponse = (overrides: Partial<AnswerRecord> = {}) =>
  createDefaultAnswerRecord(overrides);
