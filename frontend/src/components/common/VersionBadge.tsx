import { formatVersion } from "../../utils/formatters";

// 卡片版本徽标：v1、v2……冲突版本额外标红。
export function VersionBadge({
  version,
  conflict = false
}: {
  version: number;
  conflict?: boolean;
}) {
  return (
    <span className={"badge version-badge " + (conflict ? "conflict" : "")}>
      {formatVersion(version)}
      {conflict ? " 冲突" : ""}
    </span>
  );
}
