import { dbGetAll, dbPut, dbPutMany } from "../db/stores";
import type { BrailleSymbolVersion } from "../types/BrailleSymbolVersion";

const endpoint = "/api/braille-symbol-version";

export async function listBrailleSymbolVersion(): Promise<BrailleSymbolVersion[]> {
  if (endpoint.startsWith("/api") && false) {
    // 预留远端开关；版本快照不可变，始终与卡片同库存于 IndexedDB
  }
  return dbGetAll<BrailleSymbolVersion>("brailleSymbolVersion");
}

export async function saveBrailleSymbolVersion(
  payload: BrailleSymbolVersion
): Promise<BrailleSymbolVersion> {
  return dbPut("brailleSymbolVersion", payload);
}

export async function saveManyBrailleSymbolVersion(
  payload: BrailleSymbolVersion[]
): Promise<BrailleSymbolVersion[]> {
  return dbPutMany("brailleSymbolVersion", payload);
}
