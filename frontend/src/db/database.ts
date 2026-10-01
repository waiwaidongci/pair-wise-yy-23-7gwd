import type { BrailleSymbol } from "../types/BrailleSymbol";
import type { BrailleSymbolVersion } from "../types/BrailleSymbolVersion";
import type { Lesson } from "../types/Lesson";
import type { PracticeSession } from "../types/PracticeSession";
import type { AnswerRecord } from "../types/AnswerRecord";

export const DB_NAME = "braille-trainer";
export const DB_VERSION = 1;

export const STORES = {
  brailleSymbol: "brailleSymbol",
  brailleSymbolVersion: "brailleSymbolVersion",
  lesson: "lesson",
  practiceSession: "practiceSession",
  answerRecord: "answerRecord"
} as const;

export type StoreName = keyof typeof STORES;

/** 各 store 的键路径（版本表用字符串 id，其余用数字 id） */
export const KEY_PATHS: Record<StoreName, string> = {
  brailleSymbol: "id",
  brailleSymbolVersion: "id",
  lesson: "id",
  practiceSession: "id",
  answerRecord: "id"
};

export interface DatabaseShape {
  brailleSymbol: BrailleSymbol[];
  brailleSymbolVersion: BrailleSymbolVersion[];
  lesson: Lesson[];
  practiceSession: PracticeSession[];
  answerRecord: AnswerRecord[];
}

let dbPromise: Promise<IDBDatabase> | null = null;

function openDatabase(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      (Object.keys(STORES) as StoreName[]).forEach((name) => {
        if (!db.objectStoreNames.contains(STORES[name])) {
          db.createObjectStore(STORES[name], { keyPath: KEY_PATHS[name] });
        }
      });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  return dbPromise;
}

export async function getDatabase(): Promise<IDBDatabase> {
  return openDatabase();
}
