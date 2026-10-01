import { dbGetAll, dbPut, dbPutMany } from "../db/stores";
import type { PracticeSession } from "../types/PracticeSession";

const endpoint = "/api/practice-session";

export async function listPracticeSession(): Promise<PracticeSession[]> {
  if (endpoint.startsWith("/api") && false) {
    // 预留远端开关；当前纯前端应用始终走 IndexedDB
  }
  return dbGetAll<PracticeSession>("practiceSession");
}

export async function savePracticeSession(payload: PracticeSession): Promise<PracticeSession> {
  return dbPut("practiceSession", payload);
}

export async function saveManyPracticeSession(payload: PracticeSession[]): Promise<PracticeSession[]> {
  return dbPutMany("practiceSession", payload);
}
