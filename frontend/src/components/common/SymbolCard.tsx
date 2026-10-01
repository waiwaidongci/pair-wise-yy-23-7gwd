import type { BrailleSymbol } from "../../types/BrailleSymbol";
import { BrailleCell } from "./BrailleCell";
import { VersionBadge } from "./VersionBadge";
import { StatusBadge } from "./StatusBadge";

// 点字卡片：展示当前字形与版本，老师可在此修正卡片（触发新版本）。
export function SymbolCard({
  symbol,
  onEdit
}: {
  symbol: BrailleSymbol;
  onEdit?: (symbol: BrailleSymbol) => void;
}) {
  const hasConflict = symbol.versions?.some((v) => v.conflict);
  return (
    <article className="symbol-card">
      <div className="symbol-card-head">
        <strong>{symbol.letter || "（未命名）"}</strong>
        <VersionBadge version={symbol.current_version} conflict={hasConflict} />
      </div>
      <BrailleCell pattern={symbol.cell_pattern} title={symbol.pinyin || "点阵"} value={symbol.category} />
      <div className="symbol-card-meta">
        <StatusBadge value={symbol.difficulty} />
        <span className="pattern-text">{symbol.cell_pattern}</span>
      </div>
      {onEdit ? (
        <button className="banner-action" onClick={() => onEdit(symbol)}>
          修正卡片
        </button>
      ) : null}
    </article>
  );
}
