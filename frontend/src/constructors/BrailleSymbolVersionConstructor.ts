import type { BrailleSymbolVersion } from "../types/BrailleSymbolVersion";
import { buildVersionId, LEGACY_VERSION_NO, nowIso } from "../utils/versioning";
import type { GlyphContent } from "../utils/versioning";

export interface NewVersionInput extends GlyphContent {
  symbol_id: number;
  version_no: number;
  status?: BrailleSymbolVersion["status"];
  editor?: string;
  parent_version_id?: string | null;
  note?: string;
  created_at?: string;
}

export const createDefaultBrailleSymbolVersion = (
  overrides: Partial<BrailleSymbolVersion> = {}
): BrailleSymbolVersion => ({
  id: buildVersionId(1, LEGACY_VERSION_NO),
  symbol_id: 1,
  version_no: LEGACY_VERSION_NO,
  cell_pattern: "1",
  letter: "a",
  pinyin: "a",
  category: "LETTER",
  difficulty: "EASY",
  audio_hint_key: "letter-a",
  status: "ACTIVE",
  editor: "system",
  parent_version_id: null,
  created_at: nowIso(),
  note: "",
  ...overrides
});

/** 工厂：老师修正卡片后构造新版本快照 */
export const createBrailleSymbolVersion = (input: NewVersionInput): BrailleSymbolVersion =>
  createDefaultBrailleSymbolVersion({
    id: buildVersionId(input.symbol_id, input.version_no),
    symbol_id: input.symbol_id,
    version_no: input.version_no,
    cell_pattern: input.cell_pattern,
    letter: input.letter,
    pinyin: input.pinyin,
    category: input.category,
    difficulty: input.difficulty,
    audio_hint_key: input.audio_hint_key,
    status: input.status ?? "ACTIVE",
    editor: input.editor ?? "unknown",
    parent_version_id: input.parent_version_id ?? null,
    created_at: input.created_at ?? nowIso(),
    note: input.note ?? ""
  });

/** 工厂：旧数据回填时用卡片首次内容构造 v1 */
export const createLegacyBrailleSymbolVersion = (
  symbolId: number,
  glyph: GlyphContent,
  source: string
): BrailleSymbolVersion =>
  createDefaultBrailleSymbolVersion({
    id: buildVersionId(symbolId, LEGACY_VERSION_NO),
    symbol_id: symbolId,
    version_no: LEGACY_VERSION_NO,
    ...glyph,
    status: "ACTIVE",
    editor: "legacy-backfill",
    note: `旧数据无版本标识，回填为首次内容（来源：${source}）`
  });

export const createBrailleSymbolVersionForm = createDefaultBrailleSymbolVersion;
export const createBrailleSymbolVersionResponse = createDefaultBrailleSymbolVersion;
