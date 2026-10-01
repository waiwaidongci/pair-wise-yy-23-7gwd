import type { BrailleSymbol } from "../types/BrailleSymbol";
import type { BrailleSymbolVersion, CardSnapshot } from "../types/BrailleSymbolVersion";

/** 旧数据回填的首个版本号；旧记录没有任何版本标识，一律兼容为第 1 版 */
export const LEGACY_VERSION_NO = 1;

export function buildVersionId(symbolId: number, versionNo: number): string {
  return `sym-${symbolId}-v${versionNo}`;
}

/** 卡片上参与“字形修正”判定的字段；只改备注/老师名不产生新版本 */
export const GLYPH_FIELDS = [
  "cell_pattern",
  "letter",
  "pinyin",
  "category",
  "difficulty",
  "audio_hint_key"
] as const;
export type GlyphField = (typeof GLYPH_FIELDS)[number];
export type GlyphContent = Pick<BrailleSymbol, GlyphField>;

export function snapshotFromVersion(version: BrailleSymbolVersion): CardSnapshot {
  return {
    symbol_id: version.symbol_id,
    version_id: version.id,
    version_no: version.version_no,
    cell_pattern: version.cell_pattern,
    letter: version.letter,
    pinyin: version.pinyin,
    category: version.category,
    difficulty: version.difficulty,
    audio_hint_key: version.audio_hint_key
  };
}

export function glyphEquals(left: GlyphContent, right: GlyphContent): boolean {
  return GLYPH_FIELDS.every((field) => left[field] === right[field]);
}

export function diffGlyph(left: GlyphContent, right: GlyphContent): Array<{ field: GlyphField; from: string; to: string }> {
  return GLYPH_FIELDS.filter((field) => left[field] !== right[field]).map((field) => ({
    field,
    from: left[field],
    to: right[field]
  }));
}

/** 旧数据（无 current_version_id / card_snapshot）识别 */
export function isLegacySymbol(symbol: Partial<BrailleSymbol>): boolean {
  return symbol.current_version_id === undefined || symbol.current_version_id === null;
}

export function nowIso(): string {
  return new Date().toISOString();
}
