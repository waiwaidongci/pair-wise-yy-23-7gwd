import type { Lesson } from "../types/Lesson";

export const createDefaultLesson = (overrides: Partial<Lesson> = {}): Lesson => ({
  id: 0,
  title: "",
  symbol_ids: [],
  stage: "",
  estimated_minutes: 0,
  unlock_rule: "",
  ...overrides
});

export const createLessonForm = (overrides: Partial<Lesson> = {}) =>
  createDefaultLesson(overrides);

export const createLessonResponse = (overrides: Partial<Lesson> = {}) =>
  createDefaultLesson(overrides);
