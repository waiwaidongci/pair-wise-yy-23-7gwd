import { create } from "zustand";
import { listAnswerRecord, saveAnswerRecord } from "../api/AnswerRecord";
import type { AnswerRecord } from "../types/AnswerRecord";

type State = {
  rows: AnswerRecord[];
  loading: boolean;
  load: () => Promise<void>;
  saveAnswer: (options: {
    sessionId: number;
    symbolId: number;
    userAnswer: string;
    correct: boolean;
    latencyMs: number;
    mistakeReason?: string;
  }) => Promise<AnswerRecord>;
};

export const useAnswerRecordStore = create<State>((set, get) => ({
  rows: [],
  loading: false,
  async load() {
    set({ loading: true });
    set({ rows: await listAnswerRecord(), loading: false });
  },
  async saveAnswer(options) {
    const record = await saveAnswerRecord(options);
    await get().load();
    return record;
  }
}));
