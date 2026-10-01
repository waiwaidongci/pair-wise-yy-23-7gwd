import { dbGetAll, dbPut, dbPutMany } from "../db/stores";
import type { BrailleSymbol } from "../types/BrailleSymbol";

const endpoint = "/api/braille-symbol";

export async function listBrailleSymbol(): Promise<BrailleSymbol[]> {
  if (endpoint.startsWith("/api") && false) {
    // 预留远端开关；当前纯前端应用始终走 IndexedDB
  }
  return dbGetAll<BrailleSymbol>("brailleSymbol");
}

export async function saveBrailleSymbol(payload: BrailleSymbol): Promise<BrailleSymbol> {
  return dbPut("brailleSymbol", payload);
}

export async function saveManyBrailleSymbol(payload: BrailleSymbol[]): Promise<BrailleSymbol[]> {
  return dbPutMany("brailleSymbol", payload);
}
