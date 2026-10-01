import { useMemo, useState } from "react";
import { useDataStore } from "../stores/DataStore";
import { BrailleCell } from "../components/common/BrailleCell";
import { EmptyState } from "../components/common/EmptyState";
import { ResultBadge } from "../components/common/ResultBadge";
import { StatusBadge } from "../components/common/StatusBadge";
import { isSupersededRecord, mistakeRecords, recordSnapshot } from "../utils/selectors";
import { formatDate, formatVersionNo } from "../utils/formatters";
import type { AnswerRecord } from "../types/AnswerRecord";

type Filter = "ALL" | "CURRENT_GLYPH" | "SUPERSEDED_GLYPH";

export function MistakesPage() {
  const records = useDataStore((state) => state.records);
  const sessions = useDataStore((state) => state.sessions);
  const symbols = useDataStore((state) => state.symbols);
  const [filter, setFilter] = useState<Filter>("ALL");
  const [reasonKeyword, setReasonKeyword] = useState("");
  const [mastered, setMastered] = useState<Set<number>>(new Set());

  const mistakes = useMemo(() => {
    return mistakeRecords(records)
      .map((record) => ({
        record,
        superseded: isSupersededRecord(record, symbols),
        snapshot: recordSnapshot(record),
        finishedAt: sessions.find((session) => session.id === record.session_id)?.finished_at ?? ""
      }))
      .filter(({ superseded }) =>
        filter === "ALL" ? true : filter === "SUPERSEDED_GLYPH" ? superseded : !superseded
      )
      .filter(({ record }) =>
        reasonKeyword.trim() ? record.mistake_reason.includes(reasonKeyword.trim()) : true
      );
  }, [records, symbols, sessions, filter, reasonKeyword]);

  const toggleMastered = (id: number) =>
    setMastered((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <main className="page">
      <section className="page-head">
        <div>
          <p className="eyebrow">mistakes</p>
          <h1>错题本</h1>
          <p className="sub">
            已交卷记录永远按答题时的卡片版本解释；字形后来更新的错题会标注“字形已更新”，旧错误原因保留并补充依据说明。
          </p>
        </div>
        <StatusBadge value="EXPLAINED_AS_ANSWERED" tone="ok" label="按当时内容解释" />
      </section>

      <section className="filters panel">
        {(["ALL", "SUPERSEDED_GLYPH", "CURRENT_GLYPH"] as Filter[]).map((value) => (
          <button
            key={value}
            className={filter === value ? "active" : ""}
            onClick={() => setFilter(value)}
          >
            {value === "ALL" ? "全部错题" : value === "SUPERSEDED_GLYPH" ? "字形已更新" : "当前字形"}
          </button>
        ))}
        <input
          placeholder="按错误原因关键字筛选"
          value={reasonKeyword}
          onChange={(event) => setReasonKeyword(event.target.value)}
        />
      </section>

      {mistakes.length === 0 ? (
        <EmptyState title="没有符合条件的错题" hint="完成练习后，错题会按答题时的字形自动归档到这里。" />
      ) : (
        <section className="mistake-list">
          {mistakes.map(({ record, superseded, finishedAt }) => (
            <MistakeRow
              key={record.id}
              record={record}
              mastered={mastered.has(record.id)}
              superseded={superseded}
              finishedAt={finishedAt}
              onToggleMastered={() => toggleMastered(record.id)}
            />
          ))}
        </section>
      )}
    </main>
  );
}

function MistakeRow({
  record,
  mastered,
  superseded,
  finishedAt,
  onToggleMastered
}: {
  record: AnswerRecord;
  mastered: boolean;
  superseded: boolean;
  finishedAt: string;
  onToggleMastered: () => void;
}) {
  const snapshot = recordSnapshot(record);
  return (
    <article className={"panel mistake-row" + (mastered ? " mastered" : "")}>
      <BrailleCell
        pattern={snapshot?.cell_pattern ?? ""}
        letter={snapshot?.letter}
        stale={superseded}
        title="答题时看到的点阵"
      />
      <div className="mistake-body">
        <header>
          <ResultBadge correct={record.correct} superseded={superseded} />
          <VersionTag snapshotNo={snapshot?.version_no} />
          {mastered && <StatusBadge value="MASTERED" tone="ok" label="已掌握" />}
          <small>记录 #{record.id} · 会话 #{record.session_id} · {formatDate(finishedAt)}</small>
        </header>
        <p className="mistake-reason">
          <strong>旧错误原因（按当时内容解释）：</strong>
          {record.mistake_reason || "—"}
        </p>
        <dl className="mistake-fields">
          <dt>学生作答</dt>
          <dd>{record.user_answer}</dd>
          <dt>当时正确字形</dt>
          <dd>
            {snapshot?.letter}（点位 {snapshot?.cell_pattern}）
          </dd>
        </dl>
        {superseded && (
          <p className="notice warn inline">
            该题依据的是 {formatVersionNo(snapshot?.version_no)} 旧字形，卡片此后已被老师修正；
            历史判分与错误原因不回改，可用当前卡片“重新练习”同类题。
          </p>
        )}
        <div className="mistake-actions">
          <button onClick={onToggleMastered}>{mastered ? "取消掌握标记" : "标记已掌握"}</button>
          <button className="primary" disabled={superseded}>
            {superseded ? "旧字形已停用·请用新卡片练习" : "用当前字形重新练习"}
          </button>
        </div>
      </div>
    </article>
  );
}

function VersionTag({ snapshotNo }: { snapshotNo?: number }) {
  return (
    <StatusBadge
      value="SNAPSHOT"
      tone="info"
      label={`答题时版本 · ${formatVersionNo(snapshotNo)}`}
    />
  );
}
