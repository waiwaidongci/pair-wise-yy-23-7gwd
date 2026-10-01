export interface Lesson {
  id: number;
  title: string;
  symbol_ids: number[];
  stage: string;
  estimated_minutes: number;
  unlock_rule: string;
  /**
   * 待重练标记：卡片更新后，仍有未完成会话引用旧版本字形的课程会被置 true，
   * 学生完成一次按新字形出题的重练后清除。
   */
  needs_repractice: boolean;
  /** 触发待重练的卡片版本 id 列表，用于课程详情说明“为什么要重练” */
  stale_version_ids: string[];
  /** 最近一次受卡片更新影响而重算进度的时间 */
  recalculated_at: string | null;
}
