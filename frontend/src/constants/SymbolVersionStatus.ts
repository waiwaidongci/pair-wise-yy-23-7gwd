/** 卡片版本状态：当前生效 / 已被取代 / 并发保存产生的冲突分叉 */
export const SymbolVersionStatus = ["ACTIVE", "SUPERSEDED", "CONFLICT"] as const;
export type SymbolVersionStatus = (typeof SymbolVersionStatus)[number];
export const SymbolVersionStatusText: Record<SymbolVersionStatus, string> = {
  ACTIVE: "当前版本",
  SUPERSEDED: "历史版本",
  CONFLICT: "版本冲突"
};
