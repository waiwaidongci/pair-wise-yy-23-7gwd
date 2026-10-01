import { useMemo, useState } from "react";
import { useDataStore } from "../stores/DataStore";
import { PracticePanel } from "../components/common/PracticePanel";
import { EmptyState } from "../components/common/EmptyState";
import { StatusBadge, RepracticeBadge } from "../components/common/StatusBadge";
import { usePracticeSession } from "../hooks/usePracticeSession";
import {
  lessonInProgressSessions,
  repracticeLessons,
  sessionUsesStaleGlyphs
} from "../utils/selectors";
import { formatDate } from "../utils/formatters";
import type { PracticeSession } from "../types/PracticeSession";

export function PracticePage() {
  const lessons = useDataStore((state) => state.lessons);
  const sessions = useDataStore((state) => state.sessions);
  const symbols = useDataStore((state) => state.symbols);
  const startSession = useDataStore((state) => state.startSession);

  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [mode, setMode] = useState("CELL_TO_TEXT");
  const [answerInput, setAnswerInput] = useState("");
  const [finishing, setFinishing] = useState(false);

  const activeSession =
    sessions.find((session) => session.id === activeSessionId && session.status === "IN_PROGRESS") ??
    null;
  const practice = usePracticeSession(activeSession);

  const repracticeIds = useMemo(
    () => new Set(repracticeLessons(lessons).map((lesson) => lesson.id)),
    [lessons]
  );

  const chooseStaleSession = (session: PracticeSession) => {
    setActiveSessionId(session.id);
    setAnswerInput("");
  };

  const beginNew = async (lessonId: number) => {
    const session = await startSession(lessonId, mode, "student-1");
    setActiveSessionId(session.id);
    setAnswerInput("");
  };

  const submit = async () => {
    if (!practice || !answerInput.trim()) return;
    await practice.answer(answerInput.trim());
    setAnswerInput("");
  };

  const goNext = () => {
    practice?.next();
  };

  const finish = async () => {
    if (!practice) return;
    setFinishing(true);
    try {
      await practice.finish();
      setActiveSessionId(null);
    } finally {
      setFinishing(false);
    }
  };

  return (
    <main className="page">
      <section className="page-head">
        <div>
          <p className="eyebrow">practice</p>
          <h1>练习模式</h1>
          <p className="sub">
            新会话按卡片当前字形出题并冻结快照；没做完的会话即使遇到老师改卡，也继续按开始时的卡片作答。
          </p>
        </div>
        <StatusBadge value="SNAPSHOT_FROZEN" tone="info" label="题干按会话版本冻结" />
      </section>

      <section className="workbench practice-layout">
        <div className="panel">
          <h2>课程</h2>
          <label className="mode-select">
            练习模式
            <select value={mode} onChange={(event) => setMode(event.target.value)}>
              <option value="CELL_TO_TEXT">看点阵写字母</option>
              <option value="TEXT_TO_CELL">看字母选点阵</option>
              <option value="LISTENING">听写模拟</option>
              <option value="MIXED">混合练习</option>
            </select>
          </label>
          <div className="lesson-list">
            {lessons.map((lesson) => {
              const inProgress = lessonInProgressSessions(sessions, lesson.id);
              return (
                <article key={lesson.id} className="lesson-block">
                  <header>
                    <strong>{lesson.title}</strong>
                    <RepracticeBadge needsRepractice={lesson.needs_repractice} />
                  </header>
                  <small>
                    {lesson.stage} · {lesson.estimated_minutes} 分钟
                  </small>
                  {repracticeIds.has(lesson.id) && (
                    <p className="stale-hint">
                      卡片已更新，本课程有进行中的练习引用旧字形，完成一次新练习后解除待重练。
                    </p>
                  )}
                  <div className="lesson-actions">
                    <button className="primary" onClick={() => beginNew(lesson.id)}>
                      用新字形开始练习
                    </button>
                    {inProgress.map((session) => (
                      <button
                        key={session.id}
                        className={activeSessionId === session.id ? "active" : ""}
                        onClick={() => chooseStaleSession(session)}
                      >
                        继续 #{session.id}（{formatDate(session.started_at).slice(5)}）
                        {sessionUsesStaleGlyphs(session, { symbols }) && " · 旧字形"}
                      </button>
                    ))}
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        <div className="panel wide">
          {!practice || !practice.snapshot ? (
            <EmptyState
              title="选择一门课程开始练习"
              hint="开始后题目字形即被冻结；继续旧会话时会看到“仍按开始时版本出题”的提示。"
            />
          ) : (
            <>
              <PracticePanel
                question={practice.snapshot}
                mode={practice.session.mode}
                questionIndex={practice.questionIndex}
                total={practice.total}
                stale={practice.stale}
                inputValue={answerInput}
                onInputChange={setAnswerInput}
                onSubmit={submit}
                feedback={practice.feedback}
                disabled={practice.answered}
              />
              <div className="practice-footer">
                {practice.answered && practice.questionIndex < practice.total - 1 && (
                  <button className="primary" onClick={goNext}>
                    下一题
                  </button>
                )}
                {practice.answered && practice.questionIndex === practice.total - 1 && (
                  <button className="primary" onClick={finish} disabled={finishing}>
                    {finishing ? "交卷中…" : "交卷（按会话版本结算）"}
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
