import type { LMPPoint } from "@/lib/api";
import { fmtPrice } from "@/lib/format";

type Props = { point: LMPPoint | null };

const COMPONENTS = [
  { key: "energy" as const,     label: "Energy",     color: "#4ade80" },
  { key: "congestion" as const, label: "Congestion", color: "#fbbf24" },
  { key: "loss" as const,       label: "Loss",       color: "#94a3b8" },
];

export default function ComponentsBar({ point }: Props) {
  if (!point || point.energy == null) return null;

  return (
    <div className="stat-section">
      <div className="stat-section-title">LMP components</div>
      {COMPONENTS.map(({ key, label, color }) => {
        const val = point[key] ?? 0;
        return (
          <div key={key} className="stat-item">
            <span className="stat-item-label">{label}</span>
            <span className="stat-item-value" style={{ color: val < 0 ? "#a78bfa" : color }}>
              {val >= 0 ? "+" : ""}{fmtPrice(val)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
