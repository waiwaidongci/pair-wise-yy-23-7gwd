import { useEffect, useMemo } from "react";
import { useAnswerRecordStore } from "../stores/AnswerRecordStore";
import { BrailleCell } from "../components/common/BrailleCell";
import { EmptyState } from "../components/common/EmptyState";
import { StatusBadge } from "../components/common/StatusBadge";
import { VersionBadge } from "../components/common/VersionBadge";

export function MistakesPage() {
  const { rows, load } = useAnswerRecordStore();

  useEffect(() => {
    load();
  }, [load]);

  // 错题本只看答错的记录；每条记录都按“答题当时”的字形解释，不随新卡片翻案。
  const mistakes = useMemo(() => rows.filter((r) => r.correct !== "true"), [rows]);

  return (
    <section className="page">
      <div className="page-head">
        <div>
          <p className="eyebrow">braille-trainer</p>
          <h1>错题本</h1>
        </div>
      </div>

      <div className="panel wide">
        <h2>错题记录（按答题当时字形解释）</h2>
        {mistakes.length === 0 ? <EmptyState title="暂无错题" /> : null}
        <div className="symbol-grid">
          {mistakes.map((record) => (
            <article key={record.id} className="question-card">
              <div className="symbol-card-head">
                <strong>{record.symbol_snapshot?.letter || "（旧记录）"}</strong>
                <VersionBadge version={record.symbol_version} />
              </div>
              <BrailleCell
                pattern={record.symbol_snapshot?.cell_pattern}
                title={record.symbol_snapshot?.pinyin}
                value="CELL_TO_TEXT"
              />
              <p className="muted">
                你的答案：{record.user_answer || "—"} · 正确答案：{record.symbol_snapshot?.letter}
              </p>
              <p className="muted">错误原因：{record.mistake_reason || "未记录"}</p>
              <p className="muted">
                第 {record.session_id} 次会话 · 依据卡片 v{record.symbol_version} 判题
              </p>
              {record.backfilled ? <StatusBadge value="旧数据已回填" /> : null}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
