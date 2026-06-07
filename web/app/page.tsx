import { fetchHubs, fetchLMPSeries, type Hub, type HubData } from "@/lib/api";
import ISOSection from "@/components/ISOSection";
import FadeUp from "@/components/FadeUp";
import TickerBar from "@/components/TickerBar";
import LiveClock from "@/components/LiveClock";
import { fmtPrice, priceColor } from "@/lib/format";

const ISO_META = [
  { iso: "NYISO", label: "NYISO", region: "New York",               color: "#a78bfa" },
  { iso: "PJM",   label: "PJM",   region: "Mid-Atlantic & Midwest", color: "#38bdf8" },
  { iso: "CAISO", label: "CAISO", region: "California",             color: "#fb7185" },
  { iso: "SPP",   label: "SPP",   region: "Central US",             color: "#34d399" },
];

async function buildHubData(iso: string, hubs: Hub[]): Promise<HubData[]> {
  const seen = new Set<string>();
  let unique: Hub[] = [];
  for (const h of hubs) {
    if (!seen.has(h.node_id)) { seen.add(h.node_id); unique.push(h); }
  }
  if (iso === "SPP") {
    const hubNodes = unique.filter(h => /hub/i.test(h.node_id));
    if (hubNodes.length > 0) unique = hubNodes;
  }
  const limited = unique.slice(0, 6);
  return Promise.all(
    limited.map(async (hub) => {
      const [rtPoints, daPoints] = await Promise.all([
        fetchLMPSeries(iso, hub.node_id, "RT", 300),
        fetchLMPSeries(iso, hub.node_id, "DA", 48),
      ]);
      return { node_id: hub.node_id, node_name: hub.node_name ?? hub.node_id, rtPoints, daPoints };
    })
  );
}

export default async function HomePage() {
  const allHubs = await Promise.all(ISO_META.map(({ iso }) => fetchHubs(iso)));
  const allData = await Promise.all(ISO_META.map(({ iso }, i) => buildHubData(iso, allHubs[i])));

  const heroStats = ISO_META.map(({ iso, label, region, color }, i) => {
    const hubs = allData[i];
    const firstHub = hubs[0];
    const latestRT = firstHub?.rtPoints[firstHub.rtPoints.length - 1] ?? null;
    const latestDA = firstHub?.daPoints[firstHub.daPoints.length - 1] ?? null;
    const rt = latestRT?.lmp ?? null;
    const da = latestDA?.lmp ?? null;
    const spread = rt != null && da != null ? rt - da : null;
    const spreadPct = spread != null && da != null && da !== 0 ? spread / da * 100 : null;
    const firstName = firstHub?.node_name ?? "";
    const rtPrices = (firstHub?.rtPoints ?? []).map(p => p.lmp).filter((v): v is number => v != null);
    const high24 = rtPrices.length ? Math.max(...rtPrices) : null;
    const low24  = rtPrices.length ? Math.min(...rtPrices) : null;
    return { iso, label, region, color, rt, da, spread, spreadPct, firstName, high24, low24 };
  });

  return (
    <main style={{ minHeight: "100vh", paddingBottom: 80 }}>
      {/* Header */}
      <header style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="page-header-inner">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <a
              href="https://www.kardashevlabs.org"
              style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.15em", color: "rgba(255,255,255,0.22)", textDecoration: "none", textTransform: "uppercase" }}
            >
              Kardashev Labs
            </a>
            <span style={{ color: "rgba(255,255,255,0.1)" }}>·</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.55)", letterSpacing: "0.04em" }}>LMP Dashboard</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <LiveClock />
            <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, color: "rgba(255,255,255,0.22)", fontFamily: "var(--font-jetbrains-mono, monospace)", letterSpacing: "0.08em" }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#34d399", display: "inline-block", animation: "pulse-slow 2s ease-in-out infinite" }} />
              LIVE · 5-MIN
            </div>
          </div>
        </div>
      </header>

      {/* Ticker bar */}
      <TickerBar stats={heroStats} />

      <div className="page-inner">
        {/* Hero title */}
        <FadeUp>
          <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 5, letterSpacing: "-0.02em" }}>
            Locational Marginal Prices
          </h1>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", marginBottom: 36 }}>
            Real-time spot prices across major US grid operators · energy + congestion + loss
          </p>
        </FadeUp>

        {/* Hero cards */}
        <FadeUp delay={0.08}>
          <div className="hero-grid">
            {heroStats.map(({ iso, label, region, color, rt, da, spread, spreadPct, firstName, high24, low24 }) => {
              const rangePct = rt != null && high24 != null && low24 != null && high24 > low24
                ? Math.max(2, Math.min(98, (rt - low24) / (high24 - low24) * 100))
                : null;
              return (
                <div
                  key={iso}
                  className="hero-card"
                  style={{
                    background: "rgba(255,255,255,0.025)",
                    border: "1px solid rgba(255,255,255,0.07)",
                    borderTop: `2px solid ${color}40`,
                    borderRadius: 16,
                  }}
                >
                  {/* ISO badge */}
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14 }}>
                    <span style={{
                      display: "inline-flex", alignItems: "center", gap: 5,
                      fontSize: 10, fontWeight: 700, letterSpacing: "0.12em",
                      color, background: `${color}12`,
                      border: `1px solid ${color}28`,
                      padding: "3px 8px", borderRadius: 999,
                    }}>
                      <span style={{ width: 5, height: 5, borderRadius: "50%", background: color, animation: "pulse-slow 2s ease-in-out infinite" }} />
                      {label}
                    </span>
                  </div>

                  {/* RT price */}
                  <div className="hero-card-price" style={{ color: priceColor(rt), marginBottom: 3 }}>
                    {rt != null ? `$${fmtPrice(rt)}` : "—"}
                  </div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.18)", marginBottom: 10, fontFamily: "var(--font-jetbrains-mono, monospace)" }}>
                    /MWh · RT
                  </div>

                  {/* Range bar */}
                  {rangePct != null && (
                    <div style={{ marginBottom: 10 }}>
                      <div style={{ height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 2, position: "relative" }}>
                        <div style={{
                          position: "absolute", left: 0, top: 0,
                          width: `${rangePct}%`, height: "100%",
                          background: `linear-gradient(90deg, ${color}40, ${color})`,
                          borderRadius: 2,
                        }} />
                        <div style={{
                          position: "absolute",
                          left: `${rangePct}%`,
                          top: "50%",
                          transform: "translate(-50%, -50%)",
                          width: 7, height: 7, borderRadius: "50%",
                          background: color,
                          boxShadow: `0 0 5px ${color}99`,
                        }} />
                      </div>
                      {high24 != null && low24 != null && (
                        <div style={{
                          display: "flex", justifyContent: "space-between",
                          marginTop: 4, fontSize: 9,
                          color: "rgba(255,255,255,0.2)",
                          fontFamily: "var(--font-jetbrains-mono, monospace)",
                        }}>
                          <span>${fmtPrice(low24)} L</span>
                          <span>H ${fmtPrice(high24)}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Spread */}
                  {spread != null ? (
                    <div style={{
                      fontSize: 11,
                      fontFamily: "var(--font-jetbrains-mono, monospace)",
                      color: spread > 0 ? "#fb7185" : "#34d399",
                      marginBottom: 2,
                    }}>
                      {spread > 0 ? "▲" : "▼"}&nbsp;
                      {spread > 0 ? "+" : ""}{fmtPrice(spread)}
                      {spreadPct != null && (
                        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginLeft: 4 }}>
                          ({spreadPct > 0 ? "+" : ""}{spreadPct.toFixed(1)}%)
                        </span>
                      )}
                      <span style={{ color: "rgba(255,255,255,0.2)", marginLeft: 4, fontWeight: 400 }}>vs DA</span>
                    </div>
                  ) : da != null ? (
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontFamily: "var(--font-jetbrains-mono, monospace)", marginBottom: 2 }}>
                      DA ${fmtPrice(da)}
                    </div>
                  ) : null}

                  {/* Region / node */}
                  <div style={{ fontSize: 9, color: "rgba(255,255,255,0.18)", marginTop: 8, letterSpacing: "0.04em" }}>
                    {firstName ? `${firstName} · ` : ""}{region}
                  </div>
                </div>
              );
            })}
          </div>
        </FadeUp>

        {/* ISO sections */}
        {ISO_META.map(({ iso, label, color }, i) => (
          <FadeUp key={iso} delay={0.04 * i}>
            <ISOSection iso={iso} label={label} color={color} hubs={allData[i]} />
          </FadeUp>
        ))}
      </div>
    </main>
  );
}
