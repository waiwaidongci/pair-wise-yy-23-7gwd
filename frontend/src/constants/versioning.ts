// 卡片版本与会话快照相关的常量。版本号从 1 开始，单调递增。
export const INITIAL_VERSION = 1;

export const SESSION_STATUS = {
  IN_PROGRESS: "in_progress",
  FINISHED: "finished"
} as const;

export const SESSION_STATUS_TEXT: Record<string, string> = {
  in_progress: "进行中",
  finished: "已交卷"
};

// 并发保存冲突的处理策略：后保存的版本保留并标记冲突，由教师决定采用哪版。
export const CONFLICT_STRATEGY = {
  KEEP_BOTH: "keep_both",
  OVERWRITE: "overwrite"
} as const;

export const CONFLICT_STRATEGY_TEXT: Record<string, string> = {
  keep_both: "各留版本",
  overwrite: "覆盖保存"
};

// 触发“待重练”的原因码
export const REPRACTICE_REASON = {
  CARD_UPDATED: "card_updated",
  SNAPSHOT_STALE: "snapshot_stale",
  TEACHER_REQUESTED: "teacher_requested"
} as const;

export const REPRACTICE_REASON_TEXT: Record<string, string> = {
  card_updated: "练习期间有老师修正了点字卡片字形",
  snapshot_stale: "开考快照已落后于当前卡片版本",
  teacher_requested: "老师标记重练"
};

// 旧数据回填时使用的默认老师与时间戳
export const SYSTEM_TEACHER = "system";
export const BACKFILL_NOTE = "旧数据无版本标识，已回填首次内容";
