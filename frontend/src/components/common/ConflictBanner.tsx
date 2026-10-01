// 并发保存冲突提示：两名老师各留版本，说明冲突并引导确认采用哪版。
export function ConflictBanner({
  note,
  onResolve
}: {
  note?: string;
  onResolve?: () => void;
}) {
  if (!note) return null;
  return (
    <div className="banner conflict-banner" role="alert">
      <strong>卡片版本冲突</strong>
      <p>{note}</p>
      {onResolve ? (
        <button className="banner-action" onClick={onResolve}>
          查看并确认采用版本
        </button>
      ) : null}
    </div>
  );
}
