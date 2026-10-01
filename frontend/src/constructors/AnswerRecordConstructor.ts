import type { AnswerRecord } from "../types/AnswerRecord";

export const createDefaultAnswerRecord = (overrides: Partial<AnswerRecord> = {}): AnswerRecord => ({
  id: 1 as never,
  session_id: 1 as never,
  symbol_id: 1 as never,
  user_answer: "" as never,
  correct: false,
  latency_ms: 0,
  mistake_reason: "" as never,
  card_snapshot: null,
  superseded: false,
  ...overrides
});

export const createAnswerRecordForm = createDefaultAnswerRecord;
export const createAnswerRecordResponse = createDefaultAnswerRecord;
