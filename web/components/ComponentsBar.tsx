import type { LMPPoint } from "@/lib/api";
import { fmtPrice } from "@/lib/format";

type Props = { point: LMPPoint | null };

const COMPONENTS = [
  { key: "energy" as const,     label: "Energy",     color: "#34d399" },
  { key: "congestion" as const, label: "Congestion", color: "#fbbf24" },
  { key: "loss" as const,       label: "Loss",       color: "rgba(255,255,255,0.3)" },
];

export default function ComponentsBar({ point }: Props) {
  if (!point || point.energy == null) return null;

  return (
    <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 14, marginTop: 8 }}>
      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", letterSpacing: "0.1em", marginBottom: 8 }}>
        COMPONENTS
      </div>
      {COMPONENTS.map(({ key, label, color }) => {
        const val = point[key] ?? 0;
        return (
          <div key={key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>{label}</span>
            <span style={{
              fontSize: 10,
              fontFamily: "var(--font-jetbrains-mono, monospace)",
              color: val < 0 ? "#a855f7" : color,
            }}>
              {val >= 0 ? "+" : ""}{fmtPrice(val)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
