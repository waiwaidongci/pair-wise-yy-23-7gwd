import {
  clearRepracticeIfRefreshed,
  recalculateLessonsForVersions
} from "../services/lessonRecalculation";
import { ControllerError } from "../utils/ControllerError";
import { log } from "../utils/logger";
import type { DataBundle } from "../services/dataRepository";

/** 卡片更新后的课程重算入口（cardVersionService 内部已调用，供页面手动复核复用） */
export function recomputeAffectedLessons(bundle: DataBundle, symbolId: number) {
  try {
    const result = recalculateLessonsForVersions(bundle, symbolId);
    return result;
  } catch (error) {
    throw ControllerError.wrap(error);
  }
}

/** 学生完成新字形重练后清除待重练标记（不经过交卷流程时使用） */
export function dismissRepractice(bundle: DataBundle, lessonId: number, freshVersionIds: string[]) {
  try {
    const lesson = clearRepracticeIfRefreshed(bundle, lessonId, freshVersionIds);
    if (lesson) log("Lesson", 5, { lessonId, versionIds: freshVersionIds.join(",") });
    return lesson;
  } catch (error) {
    throw ControllerError.wrap(error);
  }
}
