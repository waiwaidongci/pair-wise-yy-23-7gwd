import { useEffect, useMemo, useState } from "react";
import { useLessonStore } from "../stores/LessonStore";
import { usePracticeSessionStore } from "../stores/PracticeSessionStore";
import { usePracticeSession } from "../hooks/usePracticeSession";
import { BrailleCell } from "../components/common/BrailleCell";
import { RepracticeBanner } from "../components/common/RepracticeBanner";
import { StatusBadge } from "../components/common/StatusBadge";
import { SESSION_STATUS_TEXT } from "../constants/versioning";

export function PracticePage() {
  const { rows: lessons, load: loadLessons } = useLessonStore();
  const { rows: sessions, load: loadSessions } = usePracticeSessionStore();
  const { session, questions, start, answer, finish } = usePracticeSession();
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState<Record<number, boolean>>({});

  useEffect(() => {
    loadLessons();
    loadSessions();
  }, [loadLessons, loadSessions]);

  const inProgress = useMemo(
    () => sessions.filter((s) => s.status === "in_progress"),
    [sessions]
  );

  const startLesson = async (lessonId: number) => {
    setAnswers({});
    setSubmitted({});
    await start(lessonId, "CELL_TO_TEXT");
  };

  const submitAnswer = async (symbolId: number, correctLetter: string, value: string) => {
    const correct = value.trim().toLowerCase() === correctLetter.trim().toLowerCase();
    await answer(symbolId, value, correct, 0, correct ? "" : "字形辨认错误");
    setSubmitted((prev) => ({ ...prev, [symbolId]: true }));
  };

  const finishSession = async () => {
    const correctCount = questions.filter(
      (q) => submitted[q.snapshot.symbol_id] && answers[q.snapshot.symbol_id]?.trim().toLowerCase() === q.entry?.letter.trim().toLowerCase()
    ).length;
    await finish(correctCount, questions.length - correctCount);
    setAnswers({});
    setSubmitted({});
    await loadSessions();
  };

  if (session) {
    return (
      <section className="page">
        <div className="page-head">
          <div>
            <p className="eyebrow">braille-trainer</p>
            <h1>练习模式</h1>
          </div>
          <StatusBadge value="进行中" />
        </div>

        {session.needs_repractice ? (
          <RepracticeBanner reason={session.repractice_reason} />
        ) : null}

        <div className="panel wide">
          <h2>
            第 {session.id} 次练习 · 开考快照 v
            {questions[0]?.snapshot.version ?? 1}
          </h2>
          <p className="muted">
            以下题目按开考时锁定的字形出示；老师此刻改卡不会影响本次会话。
          </p>
          <div className="symbol-grid">
            {questions.map((q) => (
              <div key={q.snapshot.symbol_id} className="question-card">
                <BrailleCell
                  pattern={q.entry?.cell_pattern ?? q.snapshot.cell_pattern}
                  title={q.entry?.pinyin ?? q.snapshot.pinyin}
                  value="CELL_TO_TEXT"
                />
                <label className="muted">
                  这是哪个字母？
                  <input
                    value={answers[q.snapshot.symbol_id] ?? ""}
                    onChange={(e) =>
                      setAnswers((prev) => ({ ...prev, [q.snapshot.symbol_id]: e.target.value }))
                    }
                    disabled={submitted[q.snapshot.symbol_id]}
                  />
                </label>
                {submitted[q.snapshot.symbol_id] ? (
                  <StatusBadge
                    value={
                      answers[q.snapshot.symbol_id]?.trim().toLowerCase() ===
                      q.entry?.letter.trim().toLowerCase()
                        ? "回答正确"
                        : `正确答案 ${q.entry?.letter}`
                    }
                  />
                ) : (
                  <button
                    className="banner-action"
                    onClick={() =>
                      submitAnswer(
                        q.snapshot.symbol_id,
                        q.entry?.letter ?? "",
                        answers[q.snapshot.symbol_id] ?? ""
                      )
                    }
                  >
                    提交
                  </button>
                )}
              </div>
            ))}
          </div>
          <div className="question-options">
            <button className="banner-action" onClick={finishSession}>
              交卷
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="page">
      <div className="page-head">
        <div>
          <p className="eyebrow">braille-trainer</p>
          <h1>练习模式</h1>
        </div>
      </div>

      <div className="panel wide">
        <h2>开始练习</h2>
        {lessons.map((lesson) => (
          <div key={lesson.id} className="lesson-row">
            <div>
              <strong>{lesson.title}</strong>
              <span className="muted"> · {lesson.symbol_ids.length} 张卡片</span>
            </div>
            <button className="banner-action" onClick={() => startLesson(lesson.id)}>
              开考
            </button>
          </div>
        ))}
      </div>

      <div className="panel wide">
        <h2>未完成会话</h2>
        {inProgress.length === 0 ? <p className="muted">暂无进行中的会话</p> : null}
        {inProgress.map((s) => (
          <div key={s.id} className="lesson-row">
            <div>
              <strong>第 {s.id} 次练习</strong>
              <span className="muted">
                {" "}· {SESSION_STATUS_TEXT[s.status] ?? s.status} · 快照 v
                {s.symbol_snapshot?.[0]?.version ?? 1}
              </span>
              {s.needs_repractice ? <RepracticeBanner reason={s.repractice_reason} /> : null}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
