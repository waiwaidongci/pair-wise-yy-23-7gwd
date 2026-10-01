import { formatDots } from "../../utils/formatters";

interface BrailleCellProps {
  /** 点阵，如 "1,2,5"；为空时显示空方 */
  pattern?: string;
  letter?: string;
  size?: number;
  /** 标记该点阵来自历史版本，提醒“不是当前字形” */
  stale?: boolean;
  title?: string;
}

/** 6 点盲文方：左列 1/2/3，右列 4/5/6 */
const DOT_LAYOUT = [
  { dot: 1, col: 1, row: 1 },
  { dot: 4, col: 2, row: 1 },
  { dot: 2, col: 1, row: 2 },
  { dot: 5, col: 2, row: 2 },
  { dot: 3, col: 1, row: 3 },
  { dot: 6, col: 2, row: 3 }
] as const;

export function parsePattern(pattern: string): Set<number> {
  return new Set(
    pattern
      .split(",")
      .map((value) => Number(value.trim()))
      .filter((value) => value >= 1 && value <= 6)
  );
}

export function BrailleCell({ pattern = "", letter, size = 72, stale = false, title }: BrailleCellProps) {
  const raised = parsePattern(pattern);
  const dotSize = Math.round(size * 0.18);
  return (
    <div className={"braille-cell" + (stale ? " stale" : "")} title={title ?? formatDots(pattern)}>
      <div
        className="braille-grid"
        style={{ width: size, height: size * 1.25, gridTemplateColumns: `1fr 1fr` }}
      >
        {DOT_LAYOUT.map(({ dot, col, row }) => (
          <span
            key={dot}
            className={"braille-dot" + (raised.has(dot) ? " raised" : "")}
            style={{
              width: dotSize,
              height: dotSize,
              gridColumn: col,
              gridRow: row
            }}
          >
            {dot}
          </span>
        ))}
      </div>
      <div className="braille-meta">
        {letter !== undefined && <strong className="braille-letter">{letter || "空方"}</strong>}
        <span className="braille-pattern">{formatDots(pattern)}</span>
      </div>
    </div>
  );
}
