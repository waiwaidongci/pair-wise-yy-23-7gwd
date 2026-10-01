import { create } from "zustand";
import {
  listBrailleSymbol,
  saveBrailleSymbol,
  type SaveSymbolResult
} from "../api/BrailleSymbol";
import {
  listSymbolVersionHistory,
  adoptSymbolVersion
} from "../api/BrailleSymbolVersion";
import { markSessionsForRepractice } from "../api/PracticeSession";
import type { BrailleSymbol, BrailleSymbolVersion } from "../types/BrailleSymbol";

type ConflictState = {
  conflict: boolean;
  note?: string;
  symbolId?: number;
};

type State = {
  rows: BrailleSymbol[];
  loading: boolean;
  conflict: ConflictState;
  versions: BrailleSymbolVersion[];
  load: () => Promise<void>;
  saveSymbol: (
    payload: BrailleSymbol,
    options: { teacher?: string; changeNote?: string; baseVersion?: number }
  ) => Promise<SaveSymbolResult>;
  loadVersions: (id: number) => Promise<void>;
  adoptVersion: (id: number, version: number, teacher: string) => Promise<void>;
  clearConflict: () => void;
};

export const useBrailleSymbolStore = create<State>((set, get) => ({
  rows: [],
  loading: false,
  conflict: { conflict: false },
  versions: [],
  async load() {
    set({ loading: true });
    set({ rows: await listBrailleSymbol(), loading: false });
  },
  async saveSymbol(payload, options) {
    const result = await saveBrailleSymbol(payload, options);
    // 卡片更新后，重算受影响的未完成会话并标出待重练。
    await markSessionsForRepractice(result.data.id);
    set({
      conflict: result.conflict
        ? { conflict: true, note: result.conflict_note, symbolId: result.data.id }
        : { conflict: false }
    });
    await get().load();
    return result;
  },
  async loadVersions(id) {
    set({ versions: await listSymbolVersionHistory(id) });
  },
  async adoptVersion(id, version, teacher) {
    await adoptSymbolVersion(id, version, teacher);
    await markSessionsForRepractice(id);
    set({ conflict: { conflict: false } });
    await get().load();
  },
  clearConflict() {
    set({ conflict: { conflict: false } });
  }
}));
