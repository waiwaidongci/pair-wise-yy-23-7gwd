/** 课程重算状态：卡片更新后受影响的未完成课程标记 NEEDS_REPRACTICE（待重练） */
export const RepracticeStatus = ["CURRENT", "NEEDS_REPRACTICE"] as const;
export type RepracticeStatus = (typeof RepracticeStatus)[number];
export const RepracticeStatusText: Record<RepracticeStatus, string> = {
  CURRENT: "已是最新",
  NEEDS_REPRACTICE: "待重练"
};
