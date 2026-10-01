import { StatusBadge } from "./StatusBadge";

// 6 点盲文点阵：左列 1/2/3，右列 4/5/6。cell_pattern 为 6 位 0/1 时绘点，
// 否则（旧占位文本）直接展示原文，保证旧数据可读。
function parseDots(pattern: string): boolean[] | null {
  if (!/^[01]{6}$/.test(pattern)) return null;
  return pattern.split("").map((ch) => ch === "1");
}

export function BrailleCell({
  pattern = "",
  title = "BrailleCell",
  value = "READY"
}: {
  pattern?: string;
  title?: string;
  value?: string;
}) {
  const dots = parseDots(pattern);
  return (
    <div className="shared-widget braille-cell">
      <strong>{title}</strong>
      {dots ? (
        <div className="dot-grid" aria-label={`盲文点阵 ${pattern}`}>
          {[0, 1, 2].map((row) => (
            <div className="dot-row" key={row}>
              {[0, 1].map((col) => {
                const index = col * 3 + row;
                return <span key={col} className={"dot " + (dots[index] ? "on" : "")} />;
              })}
            </div>
          ))}
        </div>
      ) : (
        <span className="pattern-text">{pattern || "—"}</span>
      )}
      <StatusBadge value={value} />
    </div>
  );
}
