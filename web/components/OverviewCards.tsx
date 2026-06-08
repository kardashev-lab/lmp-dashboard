import { fmtPrice, lmpBucket, spreadColor, fmtChange } from "@/lib/format";

export type OverviewStat = {
  iso: string;
  label: string;
  region: string;
  color: string;
  rt: number | null;
  da: number | null;
  spread: number | null;
  spreadPct: number | null;
  firstName: string;
  high24: number | null;
  low24: number | null;
  load: number | null;
};

export default function OverviewCards({ stats }: { stats: OverviewStat[] }) {
  return (
    <div className="overview-grid">
      {stats.map(({ label, region, color, rt, da, spread, spreadPct, firstName, high24, low24, load }) => {
        const bucket = lmpBucket(rt);
        const rangePct = rt != null && high24 != null && low24 != null && high24 > low24
          ? Math.max(4, Math.min(96, (rt - low24) / (high24 - low24) * 100))
          : null;

        return (
          <article key={label} className="overview-card">
            <div className="overview-card-top">
              <div>
                <div className="overview-iso" style={{ color }}>{label}</div>
                <div className="overview-region">{region}</div>
              </div>
              {load != null && (
                <div className="overview-load">
                  <span className="overview-load-val">{(load / 1000).toFixed(1)}</span>
                  <span className="overview-load-unit">GW load</span>
                </div>
              )}
            </div>

            <div className="overview-hub">{firstName || "Primary hub"}</div>

            <div
              className="overview-price-badge"
              style={{ background: bucket.bg, color: bucket.text }}
            >
              <span className="overview-price">
                {rt != null ? `$${fmtPrice(rt)}` : "—"}
              </span>
              <span className="overview-price-unit">/MWh RT</span>
            </div>

            {rangePct != null && high24 != null && low24 != null && (
              <div className="overview-range">
                <div className="overview-range-track">
                  <div className="overview-range-fill" style={{ width: `${rangePct}%`, background: color }} />
                  <div className="overview-range-marker" style={{ left: `${rangePct}%`, borderColor: color }} />
                </div>
                <div className="overview-range-labels">
                  <span>${fmtPrice(low24)}</span>
                  <span className="overview-range-mid">24h range</span>
                  <span>${fmtPrice(high24)}</span>
                </div>
              </div>
            )}

            <div className="overview-footer">
              <div className="overview-stat">
                <span className="overview-stat-label">Day-ahead</span>
                <span className="overview-stat-value">{da != null ? `$${fmtPrice(da)}` : "—"}</span>
              </div>
              <div className="overview-stat">
                <span className="overview-stat-label">DART spread</span>
                <span className="overview-stat-value" style={{ color: spreadColor(spread) }}>
                  {spread != null ? fmtChange(spread) : "—"}
                  {spreadPct != null && (
                    <span className="overview-stat-pct">
                      ({spreadPct > 0 ? "+" : ""}{spreadPct.toFixed(1)}%)
                    </span>
                  )}
                </span>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
