export const formatDate = (value: string) => new Date(value).toLocaleString("zh-CN");
export const formatStatus = (value: string) => value.replace(/_/g, " ");
export const formatNumber = (value: number) => new Intl.NumberFormat("zh-CN").format(value);
export const formatRisk = (value: string) =>
  ({ LOW: "低", MEDIUM: "中", HIGH: "高", CRITICAL: "严重", EXTREME: "极高" }[value] ?? value);

// 卡片版本号：v1、v2……
export const formatVersion = (version: number) => `v${version}`;

// 版本冲突说明：两名老师基于同一版本各自保存，两个版本都保留。
export const formatConflictNote = (teacher: string, baseVersion: number, currentVersion: number) =>
  `教师 ${teacher} 基于 v${baseVersion} 保存时，卡片已被他人更新到 v${currentVersion}；两个版本均已保留，请确认采用哪一版。`;

// 待重练原因文案
export const formatRepracticeReason = (reason: string) =>
  ({
    card_updated: "练习期间有老师修正了点字卡片字形",
    snapshot_stale: "开考快照已落后于当前卡片版本",
    teacher_requested: "老师标记重练"
  }[reason] ?? reason);
