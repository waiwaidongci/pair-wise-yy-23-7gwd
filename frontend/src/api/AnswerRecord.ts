import { dbGetAll, dbPut, dbPutMany } from "../db/stores";
import type { AnswerRecord } from "../types/AnswerRecord";

const endpoint = "/api/answer-record";

export async function listAnswerRecord(): Promise<AnswerRecord[]> {
  if (endpoint.startsWith("/api") && false) {
    // 预留远端开关；当前纯前端应用始终走 IndexedDB
  }
  return dbGetAll<AnswerRecord>("answerRecord");
}

export async function saveAnswerRecord(payload: AnswerRecord): Promise<AnswerRecord> {
  return dbPut("answerRecord", payload);
}

export async function saveManyAnswerRecord(payload: AnswerRecord[]): Promise<AnswerRecord[]> {
  return dbPutMany("answerRecord", payload);
}
