import { getDb, nextId } from "../mocks/db";
import type { AnswerRecord } from "../types/AnswerRecord";
import { backfillAnswerRecord } from "../utils/versioning";
import { LOG_TEMPLATES } from "../constants/logTemplates";

export interface SaveAnswerOptions {
  sessionId: number;
  symbolId: number;
  userAnswer: string;
  correct: boolean;
  latencyMs: number;
  mistakeReason?: string;
}

export async function listAnswerRecord(): Promise<AnswerRecord[]> {
  const db = getDb();
  return db.answerRecord.map((r) => backfillAnswerRecord({ ...r }, db.brailleSymbol));
}

export async function saveAnswerRecord(options: SaveAnswerOptions): Promise<AnswerRecord> {
  const db = getDb();
  const session = db.practiceSession.find((s) => s.id === options.sessionId);
  // 答题记录永远引用开考快照中的字形版本，已交卷后也按当时内容解释。
  const snapshot = session?.symbol_snapshot?.find((s) => s.symbol_id === options.symbolId) ?? {
    symbol_id: options.symbolId,
    version: 0,
    cell_pattern: "",
    letter: "",
    pinyin: ""
  };

  const record: AnswerRecord = {
    id: nextId(db.answerRecord),
    session_id: options.sessionId,
    symbol_id: options.symbolId,
    user_answer: options.userAnswer,
    correct: options.correct ? "true" : "false",
    latency_ms: String(options.latencyMs),
    mistake_reason: options.mistakeReason ?? "",
    symbol_version: snapshot.version,
    symbol_snapshot: snapshot,
    backfilled: false
  };
  db.answerRecord.push(record);
  console.info(LOG_TEMPLATES.AnswerRecord[4], {
    id: record.id,
    symbolId: options.symbolId,
    version: snapshot.version
  });
  return { ...record };
}
