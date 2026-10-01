import type { Lesson } from "../types/Lesson";

export const createDefaultLesson = (overrides: Partial<Lesson> = {}): Lesson => ({
  id: 1 as never,
  title: "基础字母（一）" as never,
  symbol_ids: [1, 2] as number[],
  stage: "入门" as never,
  estimated_minutes: 10,
  unlock_rule: "无" as never,
  needs_repractice: false,
  stale_version_ids: [],
  recalculated_at: null,
  ...overrides
});

export const createLessonForm = createDefaultLesson;
export const createLessonResponse = createDefaultLesson;
