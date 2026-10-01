import { glyphEquals, type GlyphContent } from "../utils/versioning";
import { createBrailleSymbolVersion } from "../constructors/BrailleSymbolVersionConstructor";
import { ServiceError } from "../utils/ServiceError";
import { log } from "../utils/logger";
import type { BrailleSymbol } from "../types/BrailleSymbol";
import type { BrailleSymbolVersion } from "../types/BrailleSymbolVersion";
import { recalculateLessonsForVersions } from "./lessonRecalculation";
import { commitBundle, type DataBundle } from "./dataRepository";

export interface SaveCardInput {
  symbol: BrailleSymbol;
  nextGlyph: GlyphContent;
  editor: string;
  note?: string;
  /** 老师打开编辑页时看到的版本 id；为空表示基于旧数据首次版本化 */
  baseVersionId?: string | null;
  bundle: DataBundle;
}

export interface SaveCardResult {
  symbol: BrailleSymbol;
  version: BrailleSymbolVersion;
  /** 新版本是否与另一位老师的保存形成冲突分叉 */
  conflict: boolean;
  changedLessons: DataBundle["lessons"];
}

/**
 * 老师保存卡片。
 * - 字形没变：只更新卡片冗余字段，不产生版本；
 * - 顺序保存（基于当前生效版本）：旧版本置 SUPERSEDED，新版本 ACTIVE；
 * - 并发保存（基于的版本已被取代）：双方版本都保留，分叉版本置 CONFLICT，
 *   卡片 has_conflict=true，等待老师在冲突面板裁决，同时重算受影响课程。
 */
export async function publishCardRevision(input: SaveCardInput): Promise<SaveCardResult> {
  const { symbol, nextGlyph, editor, note, baseVersionId, bundle } = input;
  const versions = bundle.versions.filter((version) => version.symbol_id === symbol.id);
  // 当前生效版本以版本表中 status=ACTIVE 为准（冲突裁决期间卡片指针可能暂时与版本表不一致）
  const active = versions.find((version) => version.status === "ACTIVE");
  const maxVersionNo = versions.reduce((max, version) => Math.max(max, version.version_no), 0);

  if (active && glyphEquals(active, nextGlyph)) {
    const merged: BrailleSymbol = { ...symbol, ...nextGlyph, has_conflict: symbol.has_conflict };
    await commitBundle({ symbols: [merged] });
    log("BrailleSymbol", 1, { symbolId: symbol.id, versionNo: active.version_no, editor });
    return { symbol: merged, version: active, conflict: false, changedLessons: [] };
  }

  // baseVersionId 存在但已不是当前生效版本 => 另一位老师先保存了
  const conflict =
    !!baseVersionId && !!active && baseVersionId !== active.id && !glyphEquals(active, nextGlyph);

  const nextNo = maxVersionNo + 1;
  const newVersion = createBrailleSymbolVersion({
    symbol_id: symbol.id,
    version_no: nextNo,
    ...nextGlyph,
    editor,
    parent_version_id: baseVersionId ?? active?.id ?? null,
    // 两位老师同时保存：先保存者的版本保持 ACTIVE，后保存者的分叉版本标记 CONFLICT，双方内容都保留
    status: "ACTIVE",
    note: conflict ? `并发保存分叉（${editor}）：${note ?? ""}`.trim() : note ?? ""
  });

  const conflictVersion: BrailleSymbolVersion = conflict
    ? { ...newVersion, status: "CONFLICT" }
    : newVersion;

  const superseded: BrailleSymbolVersion[] = [];
  if (!conflict) {
    versions.forEach((version) => {
      if (version.status === "ACTIVE") superseded.push({ ...version, status: "SUPERSEDED" });
    });
  }

  // 冲突时卡片行保持先保存者字形（后保存者字形只存在于 CONFLICT 版本里，等裁决）
  const glyphOnCard = conflict && active ? active : nextGlyph;
  const updatedSymbol: BrailleSymbol = {
    ...symbol,
    cell_pattern: glyphOnCard.cell_pattern,
    letter: glyphOnCard.letter,
    pinyin: glyphOnCard.pinyin,
    category: glyphOnCard.category,
    difficulty: glyphOnCard.difficulty,
    audio_hint_key: glyphOnCard.audio_hint_key,
    // 冲突时卡片指向真正的当前版本（先保存者）；传入 symbol 的指针可能是编辑时的旧值
    current_version_id: conflict ? active?.id ?? symbol.current_version_id : newVersion.id,
    current_version_no: conflict ? active?.version_no ?? symbol.current_version_no : nextNo,
    has_conflict: conflict ? true : symbol.has_conflict
  };

  // 保存后该卡片的生效版本：正常保存是新版本；冲突时仍以先保存者(active)为准
  const effectiveVersionId = conflict ? active?.id : newVersion.id;
  const overrides = new Map<number, string>();
  if (effectiveVersionId) overrides.set(symbol.id, effectiveVersionId);
  const { lessons, staleVersionIds } = recalculateLessonsForVersions(bundle, symbol.id, overrides);

  await commitBundle({
    symbols: [updatedSymbol],
    versions: conflict ? [conflictVersion] : [newVersion, ...superseded],
    lessons
  });

  log("BrailleSymbol", conflict ? 5 : 4, {
    symbolId: symbol.id,
    versionNo: nextNo,
    editor,
    keptVersionIds: conflict
      ? [active?.id, conflictVersion.id].filter(Boolean).join(",")
      : newVersion.id
  });
  log("BrailleSymbolVersion", 0, {
    symbolId: symbol.id,
    versionNo: nextNo,
    status: conflictVersion.status
  });
  log("Lesson", 4, {
    lessonId: lessons.filter((lesson) => lesson.needs_repractice).map((lesson) => lesson.id).join(","),
    symbolIds: symbol.id
  });

  if (conflict) {
    throw new ServiceError("VERSION_CONFLICT", {
      symbolId: symbol.id,
      activeVersionId: active?.id,
      conflictVersionId: conflictVersion.id,
      staleVersionIds
    });
  }

  return { symbol: updatedSymbol, version: newVersion, conflict: false, changedLessons: lessons };
}

/** 老师裁决冲突：保留双方版本，被选中的版本恢复 ACTIVE，其余非选中分叉置 SUPERSEDED */
export async function resolveCardConflict(
  bundle: DataBundle,
  symbolId: number,
  chosenVersionId: string
): Promise<{ symbol: BrailleSymbol; versions: BrailleSymbolVersion[] }> {
  const symbol = bundle.symbols.find((row) => row.id === symbolId);
  const chosen = bundle.versions.find((version) => version.id === chosenVersionId);
  if (!symbol || !chosen) {
    throw new ServiceError("VERSION_NOT_FOUND", { symbolId, chosenVersionId });
  }

  const touched = bundle.versions
    .filter((version) => version.symbol_id === symbolId)
    .map((version) => {
      if (version.id === chosenVersionId) return { ...version, status: "ACTIVE" as const };
      // 非选中的候选版本（当前 ACTIVE 或其他 CONFLICT 分叉）全部保留为历史
      if (version.status === "CONFLICT" || version.status === "ACTIVE") {
        return { ...version, status: "SUPERSEDED" as const };
      }
      return version;
    });

  const updatedSymbol: BrailleSymbol = {
    ...symbol,
    cell_pattern: chosen.cell_pattern,
    letter: chosen.letter,
    pinyin: chosen.pinyin,
    category: chosen.category,
    difficulty: chosen.difficulty,
    audio_hint_key: chosen.audio_hint_key,
    current_version_id: chosen.id,
    current_version_no: chosen.version_no,
    has_conflict: false
  };

  await commitBundle({
    symbols: [updatedSymbol],
    versions: touched,
    // 裁决后生效版本可能换边（选了分叉版本），课程需按最终生效版本再算一次
    lessons: recalculateLessonsForVersions(
      {
        ...bundle,
        symbols: bundle.symbols.map((row) => (row.id === symbolId ? updatedSymbol : row))
      },
      symbolId,
      new Map([[symbolId, chosen.id]])
    ).lessons
  });
  log("BrailleSymbolVersion", 1, {
    symbolId,
    versionNo: chosen.version_no,
    fromStatus: "CONFLICT",
    toStatus: "ACTIVE"
  });
  return { symbol: updatedSymbol, versions: touched };
}
