import { nowIso } from "../utils/versioning";
import { log } from "../utils/logger";
import type { Lesson } from "../types/Lesson";
import type { DataBundle } from "./dataRepository";

export interface RecalculationResult {
  lessons: Lesson[];
  /** 本次被标记待重练的课程 id */
  affectedLessonIds: number[];
  /** 课程里仍被未完成会话引用的旧版本 id（用于说明重练依据） */
  staleVersionIds: string[];
}

/**
 * 卡片更新后重算课程：
 * 只有“包含该卡片 + 存在未完成（IN_PROGRESS）会话”的课程受影响。
 * - 已交卷会话不触发重练（历史记录冻结解释，无需重做）；
 * - 未完成会话开始时冻结的版本若与课程当前版本不一致，课程标记待重练；
 * - stale_version_ids 记录仍是旧字形的版本，供页面说明“为什么要重练”。
 *
 * currentOverrides：本次保存刚发布的版本指针（bundle 里的卡片行还是旧值，
 * 必须按保存后的状态比较，否则刚更新的版本会被当成“当前”而漏标）。
 */
export function recalculateLessonsForVersions(
  bundle: DataBundle,
  symbolId: number,
  currentOverrides: Map<number, string> = new Map()
): RecalculationResult {
  const affected: Lesson[] = [];
  const affectedIds: number[] = [];
  const staleIds = new Set<string>();

  bundle.lessons
    .filter((lesson) => lesson.symbol_ids.includes(symbolId))
    .forEach((lesson) => {
      const inProgress = bundle.sessions.filter(
        (session) => session.lesson_id === lesson.id && session.status === "IN_PROGRESS"
      );
      if (inProgress.length === 0) return;

      const currentVersionIds = new Set(
        lesson.symbol_ids
          .map((id) =>
            currentOverrides.get(id) ??
            bundle.symbols.find((symbol) => symbol.id === id)?.current_version_id
          )
          .filter((id): id is string => !!id)
      );

      const staleForLesson = new Set<string>();
      inProgress.forEach((session) => {
        session.card_snapshots.forEach((snapshot) => {
          if (
            lesson.symbol_ids.includes(snapshot.symbol_id) &&
            !currentVersionIds.has(snapshot.version_id)
          ) {
            staleForLesson.add(snapshot.version_id);
          }
        });
      });

      if (staleForLesson.size > 0) {
        const mergedStale = new Set([...(lesson.stale_version_ids ?? []), ...staleForLesson]);
        affected.push({
          ...lesson,
          needs_repractice: true,
          stale_version_ids: [...mergedStale],
          recalculated_at: nowIso()
        });
        affectedIds.push(lesson.id);
        staleForLesson.forEach((id) => staleIds.add(id));
      }
    });

  if (affectedIds.length > 0) {
    log("Lesson", 4, { lessonId: affectedIds.join(","), symbolIds: symbolId });
  }

  return { lessons: affected, affectedLessonIds: affectedIds, staleVersionIds: [...staleIds] };
}

/**
 * 学生按新字形完成一次重练会话后清除标记：
 * 会话冻结的是“当前版本”，课程 stale 列表存的是“旧版本”，
 * 因此按卡片维度比较——会话练过的每个卡片当前版本都已覆盖其旧版本时才清除。
 */
export function clearRepracticeIfRefreshed(
  bundle: DataBundle,
  lessonId: number,
  freshVersionIds: string[]
): Lesson | null {
  const lesson = bundle.lessons.find((row) => row.id === lessonId);
  if (!lesson || !lesson.needs_repractice) return null;

  const freshSymbolIds = new Set(
    bundle.versions
      .filter((version) => freshVersionIds.includes(version.id))
      .map((version) => version.symbol_id)
  );
  const staleSymbolIds = new Set(
    bundle.versions
      .filter((version) => lesson.stale_version_ids.includes(version.id))
      .map((version) => version.symbol_id)
  );
  const remaining = [...staleSymbolIds].filter((symbolId) => !freshSymbolIds.has(symbolId));
  if (remaining.length > 0) return lesson;

  const cleared: Lesson = {
    ...lesson,
    needs_repractice: false,
    stale_version_ids: [],
    recalculated_at: nowIso()
  };
  log("Lesson", 5, { lessonId, versionIds: freshVersionIds.join(",") });
  return cleared;
}
