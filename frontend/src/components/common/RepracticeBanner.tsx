import { formatRepracticeReason } from "../../utils/formatters";

// 待重练提示：卡片更新后，受影响的未完成课程/会话需要重算并重练。
export function RepracticeBanner({
  reason,
  onRepractice
}: {
  reason?: string;
  onRepractice?: () => void;
}) {
  if (!reason) return null;
  return (
    <div className="banner repractice-banner" role="status">
      <strong>该练习建议重练</strong>
      <p>{formatRepracticeReason(reason)}。开考时的字形已被老师修正，继续按旧字形判题会失去依据。</p>
      {onRepractice ? (
        <button className="banner-action" onClick={onRepractice}>
          用最新字形重新开练
        </button>
      ) : null}
    </div>
  );
}
