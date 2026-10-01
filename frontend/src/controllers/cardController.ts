import {
  publishCardRevision,
  resolveCardConflict,
  type SaveCardInput
} from "../services/cardVersionService";
import { ControllerError } from "../utils/ControllerError";
import type { DataBundle } from "../services/dataRepository";
import type { BrailleSymbol } from "../types/BrailleSymbol";
import type { GlyphContent } from "../utils/versioning";

export interface SaveCardRequest {
  symbol: BrailleSymbol;
  nextGlyph: GlyphContent;
  editor: string;
  note?: string;
  baseVersionId?: string | null;
}

/** 老师保存卡片（controller 二次包装 ServiceError 后交给 store） */
export async function saveCardRevision(request: SaveCardRequest, bundle: DataBundle) {
  const input: SaveCardInput = { ...request, bundle };
  try {
    return await publishCardRevision(input);
  } catch (error) {
    // VERSION_CONFLICT 是业务结果而非崩溃：controller 把冲突详情结构化返回给页面
    if (error instanceof Error && error.name === "ServiceError" && (error as { code?: string }).code === "VERSION_CONFLICT") {
      throw ControllerError.wrap(error);
    }
    throw ControllerError.wrap(error);
  }
}

export async function settleCardConflict(
  bundle: DataBundle,
  symbolId: number,
  chosenVersionId: string
) {
  try {
    return await resolveCardConflict(bundle, symbolId, chosenVersionId);
  } catch (error) {
    throw ControllerError.wrap(error);
  }
}
