import type { BrailleSymbol, BrailleSymbolVersion } from "../types/BrailleSymbol";
import { INITIAL_VERSION, SYSTEM_TEACHER } from "../constants/versioning";

// 构造某张卡片的一个历史版本。默认取当前扁平字段，保证旧调用方不传参也能用。
export const createBrailleSymbolVersion = (
  symbol: BrailleSymbol,
  overrides: Partial<BrailleSymbolVersion> = {}
): BrailleSymbolVersion => ({
  version: symbol.current_version,
  cell_pattern: symbol.cell_pattern,
  letter: symbol.letter,
  pinyin: symbol.pinyin,
  category: symbol.category,
  difficulty: symbol.difficulty,
  audio_hint_key: symbol.audio_hint_key,
  updated_by: SYSTEM_TEACHER,
  updated_at: new Date(0).toISOString(),
  ...overrides
});

export const createDefaultBrailleSymbol = (overrides: Partial<BrailleSymbol> = {}): BrailleSymbol => {
  const base: BrailleSymbol = {
    id: 0,
    cell_pattern: "",
    letter: "",
    pinyin: "",
    category: "LETTER",
    difficulty: "NORMAL",
    audio_hint_key: "",
    current_version: INITIAL_VERSION,
    versions: []
  };
  const merged = { ...base, ...overrides };
  if (merged.versions.length === 0) {
    merged.versions = [createBrailleSymbolVersion(merged, { version: INITIAL_VERSION })];
  }
  return merged;
};

export const createBrailleSymbolForm = (overrides: Partial<BrailleSymbol> = {}) =>
  createDefaultBrailleSymbol(overrides);

export const createBrailleSymbolResponse = (overrides: Partial<BrailleSymbol> = {}) =>
  createDefaultBrailleSymbol(overrides);
