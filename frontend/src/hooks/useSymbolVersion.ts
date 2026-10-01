import { useMemo } from "react";
import { useBrailleSymbolStore } from "../stores/BrailleSymbolStore";
import type { BrailleSymbol, BrailleSymbolVersion } from "../types/BrailleSymbol";
import { getVersionEntry } from "../utils/versioning";

// 按版本号解析卡片：不传 version 时取当前版本。
// 会话出题传快照版本，新练习传当前版本，已交卷记录传答题时版本。
export function useSymbolVersion(symbolId: number, version?: number) {
  const rows = useBrailleSymbolStore((state) => state.rows);

  return useMemo(() => {
    const symbol: BrailleSymbol | undefined = rows.find((s) => s.id === symbolId);
    if (!symbol) return { symbol: undefined, entry: undefined, resolvedVersion: 0 };
    const resolvedVersion = version ?? symbol.current_version;
    const entry: BrailleSymbolVersion | undefined = getVersionEntry(symbol, resolvedVersion);
    return { symbol, entry, resolvedVersion };
  }, [rows, symbolId, version]);
}
