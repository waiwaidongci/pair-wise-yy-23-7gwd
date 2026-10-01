import { getDb, nextId } from "../mocks/db";
import type { BrailleSymbol, BrailleSymbolVersion } from "../types/BrailleSymbol";
import {
  backfillSymbol,
  diffVersionFields,
  getCurrentVersionEntry,
  nextVersionNumber
} from "../utils/versioning";
import { LOG_TEMPLATES } from "../constants/logTemplates";
import { ERROR_CODES } from "../constants/errorCodes";
import { formatConflictNote } from "../utils/formatters";

export interface SaveSymbolOptions {
  teacher?: string;
  changeNote?: string;
  // 老师编辑时所依据的版本号；不传（旧表单）时按当前版本处理，不触发冲突。
  baseVersion?: number;
}

export interface SaveSymbolResult {
  data: BrailleSymbol;
  conflict: boolean;
  conflict_code?: string;
  conflict_note?: string;
}

export async function listBrailleSymbol(): Promise<BrailleSymbol[]> {
  return getDb().brailleSymbol.map((s) => backfillSymbol({ ...s }));
}

export async function getBrailleSymbol(id: number): Promise<BrailleSymbol | undefined> {
  const found = getDb().brailleSymbol.find((s) => s.id === id);
  return found ? backfillSymbol({ ...found }) : undefined;
}

export async function listSymbolVersions(id: number): Promise<BrailleSymbolVersion[]> {
  const symbol = getDb().brailleSymbol.find((s) => s.id === id);
  return symbol ? [...(symbol.versions ?? [])] : [];
}

// 保存卡片：基于 baseVersion 做乐观并发。
// - baseVersion 等于当前版本：正常追加新版本。
// - baseVersion 不等于当前版本（期间有别的老师保存过）：追加新版本并标记冲突，两个版本都保留。
export async function saveBrailleSymbol(
  payload: BrailleSymbol,
  options: SaveSymbolOptions = {}
): Promise<SaveSymbolResult> {
  const db = getDb();
  const teacher = options.teacher ?? "anonymous";
  const now = new Date().toISOString();
  const existing = db.brailleSymbol.find((s) => s.id === payload.id);

  if (!existing) {
    const created = backfillSymbol({ ...payload, id: payload.id || nextId(db.brailleSymbol) });
    created.versions = [
      {
        version: 1,
        cell_pattern: created.cell_pattern,
        letter: created.letter,
        pinyin: created.pinyin,
        category: created.category,
        difficulty: created.difficulty,
        audio_hint_key: created.audio_hint_key,
        updated_by: teacher,
        updated_at: now,
        change_note: options.changeNote ?? "首次创建"
      }
    ];
    created.current_version = 1;
    db.brailleSymbol.push(created);
    console.info(LOG_TEMPLATES.BrailleSymbol[0], { id: created.id, teacher });
    return { data: created, conflict: false };
  }

  const head = getCurrentVersionEntry(existing);
  const baseVersion = options.baseVersion ?? existing.current_version;
  const newVersion = nextVersionNumber(existing);
  const changedFields = head
    ? diffVersionFields(head, { ...head, ...payload } as BrailleSymbolVersion)
    : [];

  const entry: BrailleSymbolVersion = {
    version: newVersion,
    cell_pattern: payload.cell_pattern,
    letter: payload.letter,
    pinyin: payload.pinyin,
    category: payload.category,
    difficulty: payload.difficulty,
    audio_hint_key: payload.audio_hint_key,
    updated_by: teacher,
    updated_at: now,
    change_note: options.changeNote ?? changedFields.join(",")
  };

  let conflict = false;
  let conflictNote: string | undefined;
  if (baseVersion !== existing.current_version) {
    conflict = true;
    conflictNote = formatConflictNote(teacher, baseVersion, existing.current_version);
    entry.conflict = true;
    entry.conflict_note = conflictNote;
    console.info(LOG_TEMPLATES.BrailleSymbol[5], {
      teacher,
      base: baseVersion,
      current: existing.current_version
    });
  } else {
    console.info(LOG_TEMPLATES.BrailleSymbol[4], {
      id: existing.id,
      version: newVersion,
      teacher,
      changedFields
    });
  }

  existing.versions = [...(existing.versions ?? []), entry];
  existing.current_version = newVersion;
  // 扁平字段同步到新头部
  existing.cell_pattern = entry.cell_pattern;
  existing.letter = entry.letter;
  existing.pinyin = entry.pinyin;
  existing.category = entry.category;
  existing.difficulty = entry.difficulty;
  existing.audio_hint_key = entry.audio_hint_key;

  return {
    data: backfillSymbol({ ...existing }),
    conflict,
    conflict_code: conflict ? ERROR_CODES.VERSION_CONFLICT : undefined,
    conflict_note: conflictNote
  };
}

// 冲突解决：教师选择采用某一版本作为当前头部（另一版本仍保留在历史中）。
export async function resolveSymbolConflict(
  id: number,
  version: number,
  teacher: string
): Promise<BrailleSymbol | undefined> {
  const db = getDb();
  const existing = db.brailleSymbol.find((s) => s.id === id);
  if (!existing) return undefined;
  const target = existing.versions?.find((v) => v.version === version);
  if (!target) return existing;
  existing.current_version = version;
  existing.cell_pattern = target.cell_pattern;
  existing.letter = target.letter;
  existing.pinyin = target.pinyin;
  existing.category = target.category;
  existing.difficulty = target.difficulty;
  existing.audio_hint_key = target.audio_hint_key;
  console.info(LOG_TEMPLATES.BrailleSymbol[6], { id, version, teacher });
  return backfillSymbol({ ...existing });
}
