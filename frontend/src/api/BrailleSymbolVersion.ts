import { getDb } from "../mocks/db";
import type { BrailleSymbol, BrailleSymbolVersion } from "../types/BrailleSymbol";
import { backfillSymbol, getVersionEntry } from "../utils/versioning";
import { resolveSymbolConflict } from "./BrailleSymbol";
import { ERROR_CODES } from "../constants/errorCodes";

// 卡片版本历史 API：与卡片主体读写分离，专供版本查看/回退/冲突解决。

export async function listSymbolVersionHistory(symbolId: number): Promise<BrailleSymbolVersion[]> {
  const symbol = getDb().brailleSymbol.find((s) => s.id === symbolId);
  return symbol ? [...(symbol.versions ?? [])] : [];
}

export async function getSymbolVersion(
  symbolId: number,
  version: number
): Promise<{ data?: BrailleSymbolVersion; code?: string }> {
  const symbol = getDb().brailleSymbol.find((s) => s.id === symbolId);
  if (!symbol) return { data: undefined, code: ERROR_CODES.VERSION_NOT_FOUND };
  const entry = getVersionEntry(backfillSymbol({ ...symbol }), version);
  return entry ? { data: entry } : { data: undefined, code: ERROR_CODES.VERSION_NOT_FOUND };
}

// 采用某一版本作为当前头部（冲突解决），另一版本仍保留在历史中。
export async function adoptSymbolVersion(
  symbolId: number,
  version: number,
  teacher: string
): Promise<BrailleSymbol | undefined> {
  return resolveSymbolConflict(symbolId, version, teacher);
}
