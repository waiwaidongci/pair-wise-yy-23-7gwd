import { getDb } from "../mocks/db";
import type { Lesson } from "../types/Lesson";

export async function listLesson(): Promise<Lesson[]> {
  return getDb().lesson.map((l) => ({ ...l }));
}

export async function saveLesson(payload: Lesson): Promise<Lesson> {
  const db = getDb();
  const index = db.lesson.findIndex((l) => l.id === payload.id);
  if (index >= 0) {
    db.lesson[index] = { ...payload };
  } else {
    db.lesson.push({ ...payload, id: payload.id || db.lesson.reduce((m, l) => Math.max(m, l.id), 0) + 1 });
  }
  console.info("save Lesson", payload);
  return { ...payload };
}
