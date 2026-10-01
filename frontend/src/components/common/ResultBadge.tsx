import type { BadgeTone } from "./StatusBadge";
import { StatusBadge } from "./StatusBadge";

export function ResultBadge({
  correct,
  superseded = false,
  correctLabel = "正确",
  wrongLabel = "错误"
}: {
  correct: boolean;
  superseded?: boolean;
  correctLabel?: string;
  wrongLabel?: string;
}) {
  const tone: BadgeTone = correct ? "ok" : "danger";
  return (
    <span className="result-badge">
      <StatusBadge value={correct ? "CORRECT" : "WRONG"} tone={tone} label={correct ? correctLabel : wrongLabel} />
      {superseded && (
        <StatusBadge value="SUPERSEDED" tone="warn" label="字形已更新·按旧版解释" />
      )}
    </span>
  );
}
