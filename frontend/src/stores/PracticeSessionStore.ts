import { create } from "zustand";
import {
  listPracticeSession,
  startPracticeSession,
  finishPracticeSession,
  recalculateSessionById
} from "../api/PracticeSession";
import type { PracticeSession } from "../types/PracticeSession";

type State = {
  rows: PracticeSession[];
  loading: boolean;
  load: () => Promise<void>;
  startSession: (lessonId: number, mode: string) => Promise<PracticeSession>;
  finishSession: (id: number, result: { score: number; mistake_count: number }) => Promise<void>;
  recalculate: (id: number) => Promise<void>;
};

export const usePracticeSessionStore = create<State>((set, get) => ({
  rows: [],
  loading: false,
  async load() {
    set({ loading: true });
    set({ rows: await listPracticeSession(), loading: false });
  },
  async startSession(lessonId, mode) {
    const session = await startPracticeSession({ lessonId, mode });
    await get().load();
    return session;
  },
  async finishSession(id, result) {
    await finishPracticeSession(id, result);
    await get().load();
  },
  async recalculate(id) {
    await recalculateSessionById(id);
    await get().load();
  }
}));
