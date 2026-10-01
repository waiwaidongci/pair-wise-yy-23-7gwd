import { create } from "zustand";
import { listAnswerRecord } from "../api/AnswerRecord";
import { useDataStore } from "./DataStore";
import type { AnswerRecord } from "../types/AnswerRecord";

type State = {
  rows: AnswerRecord[];
  loading: boolean;
  load: () => Promise<void>;
};

export const useAnswerRecordStore = create<State>((set) => ({
  rows: [],
  loading: false,
  async load() {
    set({ loading: true });
    set({ rows: await listAnswerRecord(), loading: false });
  }
}));

// 统一数据源（DataStore）变更后同步到实体 store，保证交卷/回填后错题本不陈旧
useDataStore.subscribe((state) =>
  useAnswerRecordStore.setState({ rows: state.records, loading: state.loading })
);
