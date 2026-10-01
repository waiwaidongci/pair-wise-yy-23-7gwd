export type BadgeTone = "ok" | "warn" | "danger" | "muted" | "info";

const TONE_CLASS: Record<BadgeTone, string> = {
  ok: "badge-ok",
  warn: "badge-warn",
  danger: "badge-danger",
  muted: "badge-muted",
  info: "badge-info"
};

export function StatusBadge({ value, tone = "muted", label }: { value: string; tone?: BadgeTone; label?: string }) {
  const slug = String(value).toLowerCase().replace(/_/g, "-");
  return (
    <span className={`badge ${TONE_CLASS[tone]} badge-${slug}`}>
      {label ?? String(value).replace(/_/g, " ")}
    </span>
  );
}

export function VersionBadge({
  versionNo,
  status,
  current,
  label
}: {
  versionNo: number | null | undefined;
  status?: string;
  current?: boolean;
  label?: string;
}) {
  const text = versionNo === null || versionNo === undefined ? "旧版回填" : `v${versionNo}`;
  const tone: BadgeTone =
    status === "CONFLICT" ? "danger" : current ? "ok" : status === "SUPERSEDED" ? "muted" : "info";
  return (
    <StatusBadge
      value={text}
      tone={tone}
      label={label ?? `${text}${status ? ` · ${statusLabel(status)}` : ""}`}
    />
  );
}

function statusLabel(status: string): string {
  return (
    { ACTIVE: "当前", SUPERSEDED: "已取代", CONFLICT: "冲突" } as Record<string, string>
  )[status] ?? status;
}

export function RepracticeBadge({ needsRepractice }: { needsRepractice: boolean }) {
  return needsRepractice ? (
    <StatusBadge value="NEEDS_REPRACTICE" tone="warn" label="待重练" />
  ) : (
    <StatusBadge value="CURRENT" tone="ok" label="已是最新" />
  );
}
