import { getDatabase, STORES } from "./database";
import { dbCount, dbPutMany } from "./stores";
import {
  seedAnswerRecords,
  seedBrailleSymbolVersions,
  seedBrailleSymbols,
  seedLessons,
  seedPracticeSessions
} from "../mocks/seedData";

/**
 * 首次启动时装载种子数据。
 * 只在 brailleSymbol store 为空时执行；无版本标识的旧数据由
 * services/legacyBackfill 在装载后兼容回填，而不是在这里改写。
 */
export async function seedDatabaseIfEmpty(): Promise<boolean> {
  const symbolCount = await dbCount("brailleSymbol");
  if (symbolCount > 0) return false;
  const db = await getDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(
      [
        STORES.brailleSymbol,
        STORES.brailleSymbolVersion,
        STORES.lesson,
        STORES.practiceSession,
        STORES.answerRecord
      ],
      "readwrite"
    );
    const symbolStore = transaction.objectStore(STORES.brailleSymbol);
    seedBrailleSymbols.forEach((row) => symbolStore.put(row));
    const versionStore = transaction.objectStore(STORES.brailleSymbolVersion);
    seedBrailleSymbolVersions.forEach((row) => versionStore.put(row));
    const lessonStore = transaction.objectStore(STORES.lesson);
    seedLessons.forEach((row) => lessonStore.put(row));
    const sessionStore = transaction.objectStore(STORES.practiceSession);
    seedPracticeSessions.forEach((row) => sessionStore.put(row));
    const recordStore = transaction.objectStore(STORES.answerRecord);
    seedAnswerRecords.forEach((row) => recordStore.put(row));
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
  return true;
}

/** 演示/测试用：清空后重新播种 */
export async function resetDatabaseToSeed(): Promise<void> {
  const db = await getDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(Object.values(STORES), "readwrite");
    Object.values(STORES).forEach((name) => transaction.objectStore(name).clear());
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
  await dbPutMany("brailleSymbol", seedBrailleSymbols);
  await dbPutMany("brailleSymbolVersion", seedBrailleSymbolVersions);
  await dbPutMany("lesson", seedLessons);
  await dbPutMany("practiceSession", seedPracticeSessions);
  await dbPutMany("answerRecord", seedAnswerRecords);
}
