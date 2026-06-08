import type { FuelMixPoint } from "@/lib/api";

const FUEL_COLORS: Record<string, string> = {
  "Natural Gas": "#f87171",
  Gas: "#f87171", Solar: "#fbbf24", Wind: "#60a5fa",
  Nuclear: "#a78bfa", Hydro: "#4ade80", Coal: "#94a3b8",
  Oil: "#fb923c", Batteries: "#22d3ee", Battery: "#22d3ee",
  Geothermal: "#f97316", Biomass: "#a3e635", Other: "#64748b", Imports: "#cbd5e1",
};

function fuelColor(name: string): string {
  if (FUEL_COLORS[name]) return FUEL_COLORS[name];
  const lc = name.toLowerCase();
  if (lc.includes("gas")) return "#f87171";
  if (lc.includes("solar")) return "#fbbf24";
  if (lc.includes("wind")) return "#60a5fa";
  if (lc.includes("nuclear")) return "#a78bfa";
  if (lc.includes("hydro")) return "#4ade80";
  if (lc.includes("coal")) return "#94a3b8";
  if (lc.includes("batter")) return "#22d3ee";
  return "#64748b";
}

function shortName(fuel: string): string {
  const map: Record<string, string> = {
    "Natural Gas": "Gas", Geothermal: "Geo", Biomass: "Bio",
    Batteries: "Batt", Battery: "Batt", Imports: "Imp",
  };
  return map[fuel] ?? fuel;
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
    <div className="stat-section">
      <div className="stat-section-title">Fuel mix · {(total / 1000).toFixed(1)} GW</div>
      <div className="fuel-stack">
        {top5.map(p => (
          <div key={p.fuel_type} style={{ flex: (p.mw ?? 0), background: fuelColor(p.fuel_type) }} />
        ))}
        {restMW > 0 && <div style={{ flex: restMW, background: "#334155" }} />}
      </div>
      {top5.map(p => {
        const pct = (p.mw ?? 0) / total * 100;
        return (
          <div key={p.fuel_type} className="fuel-item">
            <span className="fuel-dot" style={{ background: fuelColor(p.fuel_type) }} />
            <span className="fuel-name">{shortName(p.fuel_type)}</span>
            <span className="fuel-pct">{pct.toFixed(0)}%</span>
          </div>
        );
      })}
    </div>
  );
}
