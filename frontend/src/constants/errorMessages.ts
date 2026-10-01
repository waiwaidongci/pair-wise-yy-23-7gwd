export const ERROR_MESSAGES = {
  AUTH_REQUIRED: "请先登录后再继续操作",
  RBAC_DENIED: "当前角色没有执行该动作的权限",
  VALIDATION_FAILED: "表单字段缺失或格式错误",
  RATE_LIMITED: "请求过于频繁，请稍后再试",
  VERSION_CONFLICT:
    "卡片版本冲突：教师 {teacher} 基于 v{base_version} 保存时，卡片已被他人更新到 v{current_version}。两个版本均已保留，请确认采用哪一版。",
  VERSION_NOT_FOUND: "指定的卡片版本 v{version} 不存在，已回退到当前版本",
  SNAPSHOT_MISSING: "会话缺少开考快照，已按当前卡片内容兜底并标记回填",
  SESSION_FINISHED: "会话已交卷，不能再修改题目，只能按当时内容查看",
  BACKFILL_FAILED: "旧数据回填失败：{reason}"
};
