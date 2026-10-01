import { create } from "zustand";
import { listBrailleSymbol } from "../api/BrailleSymbol";
import { useDataStore } from "./DataStore";
import type { BrailleSymbol } from "../types/BrailleSymbol";

type State = {
  rows: BrailleSymbol[];
  loading: boolean;
  load: () => Promise<void>;
};

export const useBrailleSymbolStore = create<State>((set) => ({
  rows: [],
  loading: false,
  async load() {
    set({ loading: true });
    set({ rows: await listBrailleSymbol(), loading: false });
  }
}));

// 统一数据源（DataStore）变更后同步到实体 store，保证保存卡片/回填后列表不陈旧
useDataStore.subscribe((state) =>
  useBrailleSymbolStore.setState({ rows: state.symbols, loading: state.loading })
);
