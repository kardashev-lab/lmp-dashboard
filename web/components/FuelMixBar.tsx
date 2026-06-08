import type { FuelMixPoint } from "@/lib/api";

const FUEL_COLORS: Record<string, string> = {
  "Natural Gas": "#fb7185",
  Gas:           "#fb7185",
  Solar:         "#fbbf24",
  Wind:          "#38bdf8",
  Nuclear:       "#a78bfa",
  Hydro:         "#34d399",
  Coal:          "#6b7280",
  Oil:           "#c2410c",
  Batteries:     "#22d3ee",
  Battery:       "#22d3ee",
  Geothermal:    "#f97316",
  Biomass:       "#84cc16",
  Other:         "#475569",
  Imports:       "#94a3b8",
};

function fuelColor(name: string): string {
  if (FUEL_COLORS[name]) return FUEL_COLORS[name];
  const lc = name.toLowerCase();
  if (lc.includes("gas"))     return "#fb7185";
  if (lc.includes("solar"))   return "#fbbf24";
  if (lc.includes("wind"))    return "#38bdf8";
  if (lc.includes("nuclear")) return "#a78bfa";
  if (lc.includes("hydro"))   return "#34d399";
  if (lc.includes("coal"))    return "#6b7280";
  if (lc.includes("batter"))  return "#22d3ee";
  if (lc.includes("geo"))     return "#f97316";
  return "#475569";
}

function shortName(fuel: string): string {
  const map: Record<string, string> = {
    "Natural Gas": "Gas", Geothermal: "Geo", Biomass: "Bio",
    Batteries: "Batt", Battery: "Batt", Imports: "Imp",
  };
  return map[fuel] ?? (fuel.length > 7 ? fuel.slice(0, 7) : fuel);
}

type Props = { fuelMix: FuelMixPoint[]; totalMW?: number | null };

export default function FuelMixBar({ fuelMix, totalMW }: Props) {
  if (!fuelMix.length) return null;

  const positive = fuelMix
    .filter(p => (p.mw ?? 0) > 0)
    .sort((a, b) => (b.mw ?? 0) - (a.mw ?? 0));
  const total = totalMW ?? positive.reduce((s, p) => s + (p.mw ?? 0), 0);
  if (total === 0) return null;

  const top5 = positive.slice(0, 5);
  const restMW = positive.slice(5).reduce((s, p) => s + (p.mw ?? 0), 0);

  return (
    <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 14, marginTop: 8 }}>
      <div style={{
        fontSize: 9, color: "rgba(255,255,255,0.2)", letterSpacing: "0.1em",
        marginBottom: 8, fontFamily: "var(--font-jetbrains-mono, monospace)",
      }}>
        FUEL MIX · {(total / 1000).toFixed(1)} GW
      </div>

      {/* Stacked bar */}
      <div style={{ display: "flex", height: 4, borderRadius: 2, overflow: "hidden", marginBottom: 9, gap: 1 }}>
        {top5.map(p => (
          <div
            key={p.fuel_type}
            style={{ flex: (p.mw ?? 0), background: fuelColor(p.fuel_type) }}
          />
        ))}
        {restMW > 0 && <div style={{ flex: restMW, background: "#374151" }} />}
      </div>

      {/* Rows */}
      {top5.map(p => {
        const pct = (p.mw ?? 0) / total * 100;
        return (
          <div key={p.fuel_type} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
            <span style={{ width: 5, height: 5, borderRadius: 1, background: fuelColor(p.fuel_type), flexShrink: 0 }} />
            <span style={{
              fontSize: 9, color: "rgba(255,255,255,0.3)", flex: 1,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {shortName(p.fuel_type)}
            </span>
            <div style={{ width: 40, height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 1, overflow: "hidden" }}>
              <div style={{ width: `${pct}%`, height: "100%", background: fuelColor(p.fuel_type), opacity: 0.7 }} />
            </div>
            <span style={{
              fontSize: 9, fontFamily: "var(--font-jetbrains-mono, monospace)",
              color: "rgba(255,255,255,0.35)", width: 22, textAlign: "right",
            }}>
              {pct.toFixed(0)}%
            </span>
          </div>
        );
      })}
    </div>
  );
}
