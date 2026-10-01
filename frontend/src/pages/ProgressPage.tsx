import { useEffect, useMemo } from "react";
import { useLessonStore } from "../stores/LessonStore";
import { usePracticeSessionStore } from "../stores/PracticeSessionStore";
import { RepracticeBanner } from "../components/common/RepracticeBanner";
import { StatCard } from "../components/common/StatCard";
import { SESSION_STATUS_TEXT } from "../constants/versioning";

export function ProgressPage() {
  const { rows: lessons, load: loadLessons } = useLessonStore();
  const { rows: sessions, load: loadSessions, recalculate } = usePracticeSessionStore();

  useEffect(() => {
    loadLessons();
    loadSessions();
  }, [loadLessons, loadSessions]);

  const stats = useMemo(() => {
    const finished = sessions.filter((s) => s.status === "finished");
    const repractice = sessions.filter((s) => s.needs_repractice);
    const avg = finished.length
      ? Math.round(finished.reduce((sum, s) => sum + (s.score || 0), 0) / finished.length)
      : 0;
    return {
      total: sessions.length,
      finished: finished.length,
      repractice: repractice.length,
      avg
    };
  }, [sessions]);

  return (
    <section className="page">
      <div className="page-head">
        <div>
          <p className="eyebrow">braille-trainer</p>
          <h1>学习进度</h1>
        </div>
      </div>

      <section className="metrics">
        <StatCard label="练习次数" value={stats.total} />
        <StatCard label="已交卷" value={stats.finished} />
        <StatCard label="待重练" value={stats.repractice} />
        <StatCard label="平均正确数" value={stats.avg} />
      </section>

      <div className="panel wide">
        <h2>课程进度</h2>
        {lessons.map((lesson) => {
          const lessonSessions = sessions.filter((s) => s.lesson_id === lesson.id);
          return (
            <div key={lesson.id} className="lesson-row">
              <div>
                <strong>{lesson.title}</strong>
                <span className="muted">
                  {" "}· {lesson.symbol_ids.length} 张卡片 · {lessonSessions.length} 次练习
                </span>
                {lessonSessions.some((s) => s.needs_repractice) ? (
                  <RepracticeBanner reason="card_updated" />
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      <div className="panel wide">
        <h2>会话明细</h2>
        {sessions.map((session) => (
          <div key={session.id} className="lesson-row">
            <div>
              <strong>第 {session.id} 次练习</strong>
              <span className="muted">
                {" "}· 课程 #{session.lesson_id} · {SESSION_STATUS_TEXT[session.status] ?? session.status} ·
                正确 {session.score} · 错误 {session.mistake_count}
              </span>
              {session.needs_repractice ? <RepracticeBanner reason={session.repractice_reason} /> : null}
            </div>
            {session.status === "in_progress" ? (
              <button className="banner-action" onClick={() => recalculate(session.id)}>
                重算
              </button>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}
