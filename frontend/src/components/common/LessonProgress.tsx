import { RepracticeBadge } from "./StatusBadge";

interface LessonProgressProps {
  title: string;
  stage?: string;
  total: number;
  finished: number;
  inProgress: number;
  needsRepractice: boolean;
  staleCount?: number;
}

export function LessonProgress({
  title,
  stage,
  total,
  finished,
  inProgress,
  needsRepractice,
  staleCount = 0
}: LessonProgressProps) {
  const percent = total === 0 ? 0 : Math.round((finished / total) * 100);
  return (
    <article className="lesson-progress">
      <header className="lesson-progress-head">
        <div>
          <strong>{title}</strong>
          {stage && <span className="lesson-stage">{stage}</span>}
        </div>
        <RepracticeBadge needsRepractice={needsRepractice} />
      </header>
      <div className="progress-bar" aria-label={`完成度 ${percent}%`}>
        <span style={{ width: `${percent}%` }} />
      </div>
      <footer className="lesson-progress-foot">
        <span>已交卷 {finished}</span>
        <span>进行中 {inProgress}</span>
        <span>共 {total} 次练习</span>
        {needsRepractice && staleCount > 0 && (
          <span className="stale-hint">有 {staleCount} 个题目仍按旧字形进行，需重练</span>
        )}
      </footer>
    </article>
  );
}
