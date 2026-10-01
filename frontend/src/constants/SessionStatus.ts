/** 会话状态：未做完的会话继续按开始时的卡片出题；已交卷记录冻结解释 */
export const SessionStatus = ["IN_PROGRESS", "FINISHED"] as const;
export type SessionStatus = (typeof SessionStatus)[number];
export const SessionStatusText: Record<SessionStatus, string> = {
  IN_PROGRESS: "进行中",
  FINISHED: "已交卷"
};
