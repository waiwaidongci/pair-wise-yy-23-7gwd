import { dbBulkWrite } from "../db/stores";
import { listAnswerRecord } from "../api/AnswerRecord";
import { listBrailleSymbol } from "../api/BrailleSymbol";
import { listBrailleSymbolVersion } from "../api/BrailleSymbolVersion";
import { listLesson } from "../api/Lesson";
import { listPracticeSession } from "../api/PracticeSession";
import type { AnswerRecord } from "../types/AnswerRecord";
import type { BrailleSymbol } from "../types/BrailleSymbol";
import type { BrailleSymbolVersion } from "../types/BrailleSymbolVersion";
import type { Lesson } from "../types/Lesson";
import type { PracticeSession } from "../types/PracticeSession";

/** 服务层统一使用的全量数据包 */
export interface DataBundle {
  symbols: BrailleSymbol[];
  versions: BrailleSymbolVersion[];
  lessons: Lesson[];
  sessions: PracticeSession[];
  records: AnswerRecord[];
}

export async function loadBundle(): Promise<DataBundle> {
  const [symbols, versions, lessons, sessions, records] = await Promise.all([
    listBrailleSymbol(),
    listBrailleSymbolVersion(),
    listLesson(),
    listPracticeSession(),
    listAnswerRecord()
  ]);
  return { symbols, versions, lessons, sessions, records };
}

/** 一次事务落库服务层改动过的实体，避免版本表与卡片表写出半成品 */
export async function commitBundle(changes: Partial<DataBundle>): Promise<void> {
  await dbBulkWrite({
    brailleSymbol: changes.symbols ?? [],
    brailleSymbolVersion: changes.versions ?? [],
    lesson: changes.lessons ?? [],
    practiceSession: changes.sessions ?? [],
    answerRecord: changes.records ?? []
  });
}
