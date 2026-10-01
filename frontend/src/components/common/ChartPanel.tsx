interface ChartPanelProps {
  title: string;
  /** 每条：标签 + 0~100 的占比值 */
  bars: Array<{ label: string; value: number; hint?: string; tone?: string }>;
  emptyText?: string;
}

export function ChartPanel({ title, bars, emptyText = "暂无数据" }: ChartPanelProps) {
  return (
    <section className="panel chart-panel">
      <h2>{title}</h2>
      {bars.length === 0 ? (
        <p className="empty-inline">{emptyText}</p>
      ) : (
        <div className="chart-bars">
          {bars.map((bar) => (
            <div key={bar.label} className="chart-row" title={bar.hint}>
              <span className="chart-label">{bar.label}</span>
              <span className="chart-track">
                <span
                  className={"chart-fill " + (bar.tone ?? "")}
                  style={{ width: `${Math.max(0, Math.min(100, bar.value))}%` }}
                />
              </span>
              <span className="chart-value">{bar.value}%</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
