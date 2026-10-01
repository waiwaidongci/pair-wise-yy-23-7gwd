import type { BrailleSymbol } from "../types/BrailleSymbol";

export const createDefaultBrailleSymbol = (overrides: Partial<BrailleSymbol> = {}): BrailleSymbol => ({
  id: 1 as never,
  cell_pattern: "1" as never,
  letter: "a" as never,
  pinyin: "a" as never,
  category: "LETTER" as never,
  difficulty: "EASY" as never,
  audio_hint_key: "letter-a" as never,
  current_version_id: null,
  current_version_no: null,
  has_conflict: false,
  ...overrides
});

export const createBrailleSymbolForm = createDefaultBrailleSymbol;
export const createBrailleSymbolResponse = createDefaultBrailleSymbol;
