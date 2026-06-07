import { fetchHubs, fetchLMPSeries, type Hub, type HubData } from "@/lib/api";
import ISOSection from "@/components/ISOSection";
import FadeUp from "@/components/FadeUp";
import { fmtPrice, priceColor } from "@/lib/format";

const ISO_META = [
  { iso: "NYISO", label: "NYISO", region: "New York",                color: "#a78bfa" },
  { iso: "PJM",   label: "PJM",   region: "Mid-Atlantic & Midwest",  color: "#38bdf8" },
  { iso: "CAISO", label: "CAISO", region: "California",              color: "#fb7185" },
  { iso: "SPP",   label: "SPP",   region: "Central US",              color: "#34d399" },
];

async function buildHubData(iso: string, hubs: Hub[]): Promise<HubData[]> {
  const seen = new Set<string>();
  const unique: Hub[] = [];
  for (const h of hubs) {
    if (!seen.has(h.node_id)) {
      seen.add(h.node_id);
      unique.push(h);
    }
  }
  const limited = unique.slice(0, 6);

  return Promise.all(
    limited.map(async (hub) => {
      const [rtPoints, daPoints] = await Promise.all([
        fetchLMPSeries(iso, hub.node_id, "RT", 300),
        fetchLMPSeries(iso, hub.node_id, "DA", 48),
      ]);
      return {
        node_id: hub.node_id,
        node_name: hub.node_name ?? hub.node_id,
        rtPoints,
        daPoints,
      };
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
    const firstName = firstHub?.node_name ?? "";
    return { iso, label, region, color, rt, da, spread, firstName };
  });

  return (
    <main style={{ minHeight: "100vh", paddingBottom: 80 }}>
      {/* Header */}
      <header style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", padding: "18px 40px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <a
              href="https://www.kardashevlabs.org"
              style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.15em", color: "rgba(255,255,255,0.25)", textDecoration: "none", textTransform: "uppercase" }}
            >
              Kardashev Labs
            </a>
            <span style={{ color: "rgba(255,255,255,0.1)" }}>·</span>
            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.45)" }}>LMP Dashboard</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "rgba(255,255,255,0.2)", fontFamily: "var(--font-jetbrains-mono, monospace)" }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#34d399", display: "inline-block", animation: "pulse-slow 2s ease-in-out infinite" }} />
            LIVE · 5-min
          </div>
        </div>
      </header>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "48px 40px 0" }}>
        {/* Hero */}
        <FadeUp>
          <h1 style={{ fontSize: 30, fontWeight: 700, marginBottom: 6, letterSpacing: "-0.02em" }}>
            Locational Marginal Prices
          </h1>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", marginBottom: 36 }}>
            Real-time electricity spot prices across major US grid operators · energy + congestion + loss
          </p>
        </FadeUp>

        {/* ISO hero cards */}
        <FadeUp delay={0.08}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 14,
            marginBottom: 60,
          }}>
            {heroStats.map(({ iso, label, region, color, rt, da, spread, firstName }) => (
              <div
                key={iso}
                style={{
                  background: "rgba(255,255,255,0.025)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderTop: `2px solid ${color}35`,
                  borderRadius: 16,
                  padding: "18px 22px",
                }}
              >
                {/* ISO badge */}
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14 }}>
                  <span style={{
                    display: "inline-flex", alignItems: "center", gap: 5,
                    fontSize: 10, fontWeight: 700, letterSpacing: "0.12em",
                    color, background: `${color}15`,
                    border: `1px solid ${color}30`,
                    padding: "3px 8px", borderRadius: 999,
                  }}>
                    <span style={{ width: 5, height: 5, borderRadius: "50%", background: color, animation: "pulse-slow 2s ease-in-out infinite" }} />
                    {label}
                  </span>
                </div>

                {/* RT price */}
                <div style={{
                  fontSize: 34, fontWeight: 700, lineHeight: 1,
                  fontFamily: "var(--font-jetbrains-mono, monospace)",
                  color: priceColor(rt),
                  marginBottom: 4,
                }}>
                  {rt != null ? `$${fmtPrice(rt)}` : "—"}
                </div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", marginBottom: 10 }}>/MWh · RT</div>

                {/* Spread */}
                {spread != null ? (
                  <div style={{ fontSize: 12, color: spread > 0 ? "#fb7185" : "#34d399" }}>
                    {spread > 0 ? "+" : ""}{fmtPrice(spread)} vs DA
                  </div>
                ) : da != null ? (
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>
                    DA ${fmtPrice(da)}
                  </div>
                ) : null}

                {/* Region / node */}
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.18)", marginTop: 6 }}>
                  {firstName ? `${firstName} · ` : ""}{region}
                </div>
              </div>
            ))}
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
