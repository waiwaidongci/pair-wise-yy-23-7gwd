import { useCallback, useMemo, useState } from "react";
import { useDataStore } from "../stores/DataStore";
import {
  frozenSnapshot,
  sessionUsesStaleGlyphs
} from "../utils/selectors";
import type { AnswerRecord } from "../types/AnswerRecord";
import type { PracticeSession } from "../types/PracticeSession";

export interface ActivePractice {
  session: PracticeSession;
  questionIndex: number;
  total: number;
  snapshot: ReturnType<typeof frozenSnapshot>;
  stale: boolean;
  feedback: { correct: boolean; message: string } | null;
  answered: boolean;
  records: AnswerRecord[];
  answer: (input: string, latencyMs?: number) => Promise<void>;
  next: () => void;
  finish: () => Promise<void>;
}

/**
 * 进行中会话驱动：
 * 题干一律取会话冻结快照（没做完的会话继续按开始时的卡片出题）；
 * 作答记录带当时版本，交卷后课程可据此清除“待重练”。
 */
export function usePracticeSession(session: PracticeSession | null): ActivePractice | null {
  const symbols = useDataStore((state) => state.symbols);
  const records = useDataStore((state) => state.records);
  const answerQuestion = useDataStore((state) => state.answerQuestion);
  const finishSession = useDataStore((state) => state.finishSession);

  const [questionIndex, setQuestionIndex] = useState(0);
  const [feedback, setFeedback] = useState<{ correct: boolean; message: string } | null>(null);
  const [localRecords, setLocalRecords] = useState<AnswerRecord[]>([]);
  const [startedAt, setStartedAt] = useState(() => Date.now());

  const sessionRecords = useMemo(
    () => records.filter((record) => session && record.session_id === session.id),
    [records, session]
  );
  const allRecords = useMemo(() => {
    const known = new Map(sessionRecords.map((record) => [record.id, record]));
    localRecords.forEach((record) => known.set(record.id, record));
    return [...known.values()];
  }, [sessionRecords, localRecords]);

  const answer = useCallback(
    async (input: string, latencyMs?: number) => {
      if (!session || feedback) return;
      const snapshot = frozenSnapshot(session, questionIndex);
      if (!snapshot) return;
      const mistakeReason = snapshot
        ? `把第 ${snapshot.version_no} 版「${snapshot.letter}」（点位 ${snapshot.cell_pattern}）答成了「${input}」`
        : "";
      const { record, superseded } = await answerQuestion({
        session,
        questionIndex,
        userAnswer: input,
        latencyMs: latencyMs ?? Date.now() - startedAt,
        mistakeReason
      });
      setLocalRecords((rows) => [...rows, record]);
      setFeedback({
        correct: record.correct,
        message: record.correct
          ? "回答正确"
          : `回答错误，正确答案按会话开始时的字形是「${snapshot.letter}」${
              superseded ? "（该卡片此后已更新，本条仍按旧字形判分）" : ""
            }`
      });
    },
    [session, feedback, questionIndex, answerQuestion, startedAt]
  );

  const next = useCallback(() => {
    setQuestionIndex((index) => index + 1);
    setFeedback(null);
    setStartedAt(Date.now());
  }, []);

  const finish = useCallback(async () => {
    if (!session) return;
    await finishSession({ ...session });
  }, [session, finishSession]);

  if (!session) return null;

  const snapshot = frozenSnapshot(session, questionIndex);
  return {
    session,
    questionIndex,
    total: session.card_snapshots.length,
    snapshot,
    stale: sessionUsesStaleGlyphs(session, { symbols }),
    feedback,
    answered: !!feedback,
    records: allRecords,
    answer,
    next,
    finish
  };
}
