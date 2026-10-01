import { getDb, nextId } from "../mocks/db";
import type { PracticeSession } from "../types/PracticeSession";
import type { BrailleSymbol } from "../types/BrailleSymbol";
import {
  backfillSession,
  buildSnapshot,
  recalculateSession
} from "../utils/versioning";
import { SESSION_STATUS, REPRACTICE_REASON } from "../constants/versioning";
import { LOG_TEMPLATES } from "../constants/logTemplates";

export interface StartSessionOptions {
  lessonId: number;
  mode: string;
}

export async function listPracticeSession(): Promise<PracticeSession[]> {
  const db = getDb();
  return db.practiceSession.map((s) =>
    backfillSession({ ...s }, db.brailleSymbol, db.lesson)
  );
}

export async function getPracticeSession(id: number): Promise<PracticeSession | undefined> {
  const db = getDb();
  const found = db.practiceSession.find((s) => s.id === id);
  return found ? backfillSession({ ...found }, db.brailleSymbol, db.lesson) : undefined;
}

// 开考：按当前卡片内容生成锁定快照，会话期间题目不再随卡片更新。
export async function startPracticeSession(
  options: StartSessionOptions
): Promise<PracticeSession> {
  const db = getDb();
  const lesson = db.lesson.find((l) => l.id === options.lessonId);
  const symbolIds = lesson?.symbol_ids ?? [];
  const snapshot = symbolIds.map((id) => buildSnapshot(db.brailleSymbol.find((s) => s.id === id)));

  const session: PracticeSession = {
    id: nextId(db.practiceSession),
    lesson_id: options.lessonId,
    mode: options.mode,
    started_at: new Date().toISOString(),
    finished_at: "",
    score: 0,
    mistake_count: 0,
    status: SESSION_STATUS.IN_PROGRESS,
    symbol_snapshot: snapshot,
    needs_repractice: false,
    repractice_reason: "",
    backfilled: false
  };
  db.practiceSession.push(session);
  console.info(LOG_TEMPLATES.PracticeSession[4], { count: snapshot.length });
  return { ...session };
}

// 交卷：已完成会话不再受卡片更新影响，答题记录按当时内容解释。
export async function finishPracticeSession(
  id: number,
  result: { score: number; mistake_count: number }
): Promise<PracticeSession | undefined> {
  const db = getDb();
  const session = db.practiceSession.find((s) => s.id === id);
  if (!session) return undefined;
  session.status = SESSION_STATUS.FINISHED;
  session.finished_at = new Date().toISOString();
  session.score = result.score;
  session.mistake_count = result.mistake_count;
  console.info(LOG_TEMPLATES.PracticeSession[2], { id, score: result.score });
  return { ...session };
}

// 卡片更新后：重算所有未完成会话，快照落后的标记为待重练。
export async function markSessionsForRepractice(
  symbolId: number
): Promise<{ sessionId: number; reason: string }[]> {
  const db = getDb();
  const affected: { sessionId: number; reason: string }[] = [];
  for (const session of db.practiceSession) {
    if (session.status !== SESSION_STATUS.IN_PROGRESS) continue;
    const { affectedSymbolIds, reason } = recalculateSession(session, db.brailleSymbol);
    if (affectedSymbolIds.includes(symbolId)) {
      session.needs_repractice = true;
      session.repractice_reason = REPRACTICE_REASON.CARD_UPDATED;
      affected.push({ sessionId: session.id, reason });
      console.info(LOG_TEMPLATES.PracticeSession[6], { id: session.id, reason });
    }
  }
  return affected;
}

// 重算单个会话：返回受影响卡片 id 列表。
export async function recalculateSessionById(
  id: number
): Promise<{ affectedSymbolIds: number[]; reason: string }> {
  const db = getDb();
  const session = db.practiceSession.find((s) => s.id === id);
  if (!session) return { affectedSymbolIds: [], reason: REPRACTICE_REASON.SNAPSHOT_STALE };
  const result = recalculateSession(session, db.brailleSymbol);
  if (result.affectedSymbolIds.length > 0 && session.status === SESSION_STATUS.IN_PROGRESS) {
    session.needs_repractice = true;
    session.repractice_reason = result.reason;
  }
  console.info(LOG_TEMPLATES.PracticeSession[5], {
    id,
    from: session.symbol_snapshot?.[0]?.version,
    to: db.brailleSymbol.find((s: BrailleSymbol) => s.id === session.symbol_snapshot?.[0]?.symbol_id)
      ?.current_version
  });
  return result;
}
