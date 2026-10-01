export const ERROR_MESSAGES = {
  AUTH_REQUIRED: "请先登录后再继续操作",
  RBAC_DENIED: "当前角色没有执行该动作的权限",
  VALIDATION_FAILED: "表单字段缺失或格式错误",
  RATE_LIMITED: "请求过于频繁，请稍后再试",
  VERSION_CONFLICT: "卡片在您编辑期间被其他老师修改，已保留双方版本并标记冲突，请人工确认后合并",
  VERSION_NOT_FOUND: "未找到指定的卡片版本，无法还原当时字形",
  SNAPSHOT_MISSING: "该记录缺少答题时的卡片快照，不能按当时内容解释",
  LEGACY_BACKFILL_FAILED: "旧数据版本回填失败，已保留原始内容并阻止版本化保存"
};

export type ErrorMessageKey = keyof typeof ERROR_MESSAGES;
