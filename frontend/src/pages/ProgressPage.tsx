import { useMemo } from "react";
import { useDataStore } from "../stores/DataStore";
import { ChartPanel } from "../components/common/ChartPanel";
import { LessonProgress } from "../components/common/LessonProgress";
import { StatCard } from "../components/common/StatCard";
import { StatusBadge } from "../components/common/StatusBadge";
import { useBackfillStatus } from "../hooks/useIndexedDbStore";
import {
  conflictVersionsOf,
  lessonInProgressSessions,
  repracticeLessons,
  sessionRecords
} from "../utils/selectors";
import { formatDate, formatVersionNo } from "../utils/formatters";

export function ProgressPage() {
  const lessons = useDataStore((state) => state.lessons);
  const sessions = useDataStore((state) => state.sessions);
  const records = useDataStore((state) => state.records);
  const symbols = useDataStore((state) => state.symbols);
  const versions = useDataStore((state) => state.versions);
  const backfill = useBackfillStatus();

  const finishedSessions = useMemo(
    () => sessions.filter((session) => session.status === "FINISHED"),
    [sessions]
  );
  const staleSessionCount = useMemo(
    () =>
      sessions.filter(
        (session) =>
          session.status === "IN_PROGRESS" &&
          session.card_snapshots?.some((snapshot) => {
            const symbol = symbols.find((row) => row.id === snapshot.symbol_id);
            return symbol && symbol.current_version_id !== snapshot.version_id;
          })
      ).length,
    [sessions, symbols]
  );

  const scoreBars = useMemo(
    () =>
      [...finishedSessions]
        .sort((a, b) => a.finished_at.localeCompare(b.finished_at))
        .map((session) => ({
          label: `#${session.id}`,
          value: session.score,
          hint: `会话 ${session.id} · 交卷于 ${formatDate(session.finished_at)}`,
          tone: session.score >= 80 ? "good" : session.score >= 60 ? "mid" : "bad"
        })),
    [finishedSessions]
  );

  const versionBars = useMemo(() => {
    const groups = new Map<string, { total: number; current: number }>();
    records.forEach((record) => {
      const key = record.card_snapshot ? formatVersionNo(record.card_snapshot.version_no) : "未回填";
      const entry = groups.get(key) ?? { total: 0, current: 0 };
      entry.total += 1;
      const symbol = symbols.find((row) => row.id === record.symbol_id);
      if (record.card_snapshot && symbol?.current_version_id === record.card_snapshot.version_id) {
        entry.current += 1;
      }
      groups.set(key, entry);
    });
    return [...groups.entries()].map(([label, entry]) => ({
      label,
      value: Math.round((entry.current / entry.total) * 100),
      hint: `${entry.current}/${entry.total} 条记录对应卡片当前版本`,
      tone: entry.current === entry.total ? "good" : "mid"
    }));
  }, [records, symbols]);

  const conflictCount = symbols.filter((symbol) => symbol.has_conflict).length;

  return (
    <main className="page">
      <section className="page-head">
        <div>
          <p className="eyebrow">progress</p>
          <h1>学习进度</h1>
          <p className="sub">
            课程在卡片更新后自动重算：受影响的未完成课程标记“待重练”，统计区分当前版本与历史版本答题。
          </p>
        </div>
        <StatusBadge value="RECALCULATED_ON_SAVE" tone="info" label="课程随卡片更新重算" />
      </section>

      <section className="metrics">
        <StatCard label="待重练课程" value={repracticeLessons(lessons).length} />
        <StatCard label="沿用旧字形的进行中会话" value={staleSessionCount} />
        <StatCard label="待裁决冲突卡片" value={conflictCount} />
        <StatCard label="已交卷会话" value={finishedSessions.length} />
      </section>

      {backfill.changed && (
        <section className="notice info">
          旧数据已兼容回填：{backfill.counts.symbols} 张卡片补上首个版本，
          {backfill.counts.records} 条历史记录补回当时卡片快照。
        </section>
      )}

      <section className="progress-lessons">
        {lessons.map((lesson) => {
          const lessonSessions = sessions.filter((session) => session.lesson_id === lesson.id);
          const finished = lessonSessions.filter((session) => session.status === "FINISHED").length;
          const inProgress = lessonInProgressSessions(sessions, lesson.id).length;
          const staleVersionIds = new Set(lesson.stale_version_ids);
          return (
            <LessonProgress
              key={lesson.id}
              title={lesson.title}
              stage={lesson.stage}
              total={lessonSessions.length}
              finished={finished}
              inProgress={inProgress}
              needsRepractice={lesson.needs_repractice}
              staleCount={staleVersionIds.size}
            />
          );
        })}
      </section>

      <section className="workbench">
        <ChartPanel title="已交卷会话正确率趋势（冻结版本结算）" bars={scoreBars} />
        <ChartPanel title="答题记录版本分布：当前版本占比" bars={versionBars} />
      </section>

      <section className="panel">
        <h2>会话版本台账</h2>
        <div className="table">
          {sessions.map((session) => {
            const sessionRecs = sessionRecords(records, session.id);
            const stale = session.card_snapshots?.some((snapshot) => {
              const symbol = symbols.find((row) => row.id === snapshot.symbol_id);
              return symbol && symbol.current_version_id !== snapshot.version_id;
            });
            return (
              <article key={session.id} className="row session-ledger-row">
                <strong>#{session.id} · 课程 {session.lesson_id}</strong>
                <span>{session.mode}</span>
                <StatusBadge
                  value={session.status}
                  tone={session.status === "FINISHED" ? "ok" : "info"}
                  label={session.status === "FINISHED" ? "已交卷" : "进行中"}
                />
                <span className={stale ? "stale-hint" : ""}>
                  冻结 {session.baseline_version_ids?.length ?? 0} 题
                  {stale ? " · 含旧字形题目" : ""}
                </span>
                <span>{sessionRecs.length} 条记录</span>
                <span>{session.status === "FINISHED" ? formatDate(session.finished_at) : formatDate(session.started_at)}</span>
              </article>
            );
          })}
        </div>
      </section>

      {conflictCount > 0 && (
        <section className="panel">
          <h2>版本冲突待办</h2>
          {symbols
            .filter((symbol) => symbol.has_conflict)
            .map((symbol) => (
              <article key={symbol.id} className="row">
                <strong>卡片「{symbol.letter}」</strong>
                <span>
                  候选：{conflictVersionsOf(versions, symbol.id)
                    .map((version) => formatVersionNo(version.version_no))
                    .join(" / ")}
                </span>
                <StatusBadge value="CONFLICT" tone="danger" label="请到学习卡片页裁决" />
              </article>
            ))}
        </section>
      )}
    </main>
  );
}
