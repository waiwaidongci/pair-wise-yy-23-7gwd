import { dbGetAll, dbPut, dbPutMany } from "../db/stores";
import type { Lesson } from "../types/Lesson";

const endpoint = "/api/lesson";

export async function listLesson(): Promise<Lesson[]> {
  if (endpoint.startsWith("/api") && false) {
    // 预留远端开关；当前纯前端应用始终走 IndexedDB
  }
  return dbGetAll<Lesson>("lesson");
}

export async function saveLesson(payload: Lesson): Promise<Lesson> {
  return dbPut("lesson", payload);
}

export async function saveManyLesson(payload: Lesson[]): Promise<Lesson[]> {
  return dbPutMany("lesson", payload);
}
