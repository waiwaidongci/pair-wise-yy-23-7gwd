import { mockData } from "./seedData";
import type { BrailleSymbol } from "../types/BrailleSymbol";
import type { PracticeSession } from "../types/PracticeSession";
import type { AnswerRecord } from "../types/AnswerRecord";
import type { Lesson } from "../types/Lesson";
import {
  backfillAnswerRecord,
  backfillSession,
  backfillSymbol
} from "../utils/versioning";

// 纯前端模拟后端：模块级单例，首次访问时把旧种子数据回填为带版本的数据。
// 所有写操作都落到这里，老师改卡、会话快照、答题记录才会真正联动。
interface MockDatabase {
  brailleSymbol: BrailleSymbol[];
  lesson: Lesson[];
  practiceSession: PracticeSession[];
  answerRecord: AnswerRecord[];
}

let db: MockDatabase | null = null;

function initDb(): MockDatabase {
  const lessons = [...(mockData.lesson as unknown as Lesson[])];
  const symbols = (mockData.brailleSymbol as unknown as BrailleSymbol[]).map((raw) =>
    backfillSymbol(raw)
  );
  const sessions = (mockData.practiceSession as unknown as PracticeSession[]).map((raw) =>
    backfillSession(raw, symbols, lessons)
  );
  const records = (mockData.answerRecord as unknown as AnswerRecord[]).map((raw) =>
    backfillAnswerRecord(raw, symbols)
  );
  return { brailleSymbol: symbols, lesson: lessons, practiceSession: sessions, answerRecord: records };
}

export function getDb(): MockDatabase {
  if (!db) {
    db = initDb();
  }
  return db;
}

// 测试/重置用：清空内存库，下次访问重新从种子回填。
export function resetDb(): void {
  db = null;
}

export function nextId(rows: { id: number }[]): number {
  return rows.reduce((max, row) => Math.max(max, row.id), 0) + 1;
}
