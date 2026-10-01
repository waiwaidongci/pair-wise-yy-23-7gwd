import { useMemo, useState } from "react";
import { usePracticeSessionStore } from "../stores/PracticeSessionStore";
import { useAnswerRecordStore } from "../stores/AnswerRecordStore";
import { useBrailleSymbolStore } from "../stores/BrailleSymbolStore";
import type { PracticeSession } from "../types/PracticeSession";
import type { BrailleSymbolVersion, SymbolSnapshot } from "../types/BrailleSymbol";
import { getVersionEntry } from "../utils/versioning";

export interface SessionQuestion {
  snapshot: SymbolSnapshot;
  entry?: BrailleSymbolVersion;
}

// 管理一次练习会话：开考锁定快照、答题按快照版本判题、交卷后只可查看。
export function usePracticeSession() {
  const [session, setSession] = useState<PracticeSession | null>(null);
  const startSession = usePracticeSessionStore((state) => state.startSession);
  const finishSession = usePracticeSessionStore((state) => state.finishSession);
  const saveAnswer = useAnswerRecordStore((state) => state.saveAnswer);
  const symbols = useBrailleSymbolStore((state) => state.rows);

  const questions = useMemo<SessionQuestion[]>(() => {
    if (!session) return [];
    return session.symbol_snapshot.map((snapshot) => {
      const symbol = symbols.find((item) => item.id === snapshot.symbol_id);
      const entry = symbol ? getVersionEntry(symbol, snapshot.version) : undefined;
      return { snapshot, entry };
    });
  }, [session, symbols]);

  const start = async (lessonId: number, mode: string) => {
    const created = await startSession(lessonId, mode);
    setSession(created);
    return created;
  };

  const answer = async (
    symbolId: number,
    userAnswer: string,
    correct: boolean,
    latencyMs: number,
    mistakeReason = ""
  ) => {
    if (!session) return undefined;
    return saveAnswer({
      sessionId: session.id,
      symbolId,
      userAnswer,
      correct,
      latencyMs,
      mistakeReason
    });
  };

  const finish = async (score: number, mistakeCount: number) => {
    if (!session) return;
    await finishSession(session.id, { score, mistake_count: mistakeCount });
    setSession(null);
  };

  return { session, questions, start, answer, finish };
}
