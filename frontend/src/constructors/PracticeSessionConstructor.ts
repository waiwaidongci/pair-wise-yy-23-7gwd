import type { PracticeSession } from "../types/PracticeSession";

export const createDefaultPracticeSession = (overrides: Partial<PracticeSession> = {}): PracticeSession => ({
  id: 1 as never,
  lesson_id: 1 as never,
  mode: "CELL_TO_TEXT" as never,
  started_at: "2026-09-01T09:00:00Z" as never,
  finished_at: "" as never,
  score: 0,
  mistake_count: 0,
  status: "IN_PROGRESS",
  card_snapshots: [],
  baseline_version_ids: [],
  editor: "student-1",
  ...overrides
});

export const createPracticeSessionForm = createDefaultPracticeSession;
export const createPracticeSessionResponse = createDefaultPracticeSession;
