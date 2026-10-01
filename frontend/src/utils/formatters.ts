export const formatDate = (value: string) =>
  !value ? "—" : new Date(value).toLocaleString("zh-CN", { hour12: false });
export const formatStatus = (value: string) => (value ?? "").replace(/_/g, " ");
export const formatNumber = (value: number) => new Intl.NumberFormat("zh-CN").format(value ?? 0);
export const formatRisk = (value: string) =>
  ({ LOW: "低", MEDIUM: "中", HIGH: "高", CRITICAL: "严重", EXTREME: "极高" }[value] ?? value);
export const formatVersionNo = (value: number | null | undefined) =>
  value === null || value === undefined ? "旧版未编号" : `第 ${value} 版`;
export const formatDots = (cellPattern: string) =>
  cellPattern
    .split(",")
    .map((dot) => dot.trim())
    .filter(Boolean)
    .map((dot) => `●${dot}`)
    .join(" ") || "空方";
