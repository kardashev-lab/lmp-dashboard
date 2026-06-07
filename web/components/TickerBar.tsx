import { fmtPrice, priceColor } from "@/lib/format";

type TickerStat = {
  iso: string;
  label: string;
  color: string;
  rt: number | null;
  spread: number | null;
};

export default function TickerBar({ stats }: { stats: TickerStat[] }) {
  // 8 copies → seamless loop across any viewport width
  const items: TickerStat[] = Array(8).fill(null).flatMap(() => stats);

  return (
    <div style={{
      borderBottom: "1px solid rgba(255,255,255,0.06)",
      background: "rgba(0,0,0,0.3)",
      overflow: "hidden",
    }}>
      <div className="ticker-inner">
        {items.map((s, i) => (
          <div key={i} style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            padding: "7px 22px",
            borderRight: "1px solid rgba(255,255,255,0.04)",
          }}>
            <span style={{
              fontSize: 9, fontWeight: 700, letterSpacing: "0.15em",
              color: s.color, textTransform: "uppercase",
            }}>
              {s.label}
            </span>
            <span style={{
              fontFamily: "var(--font-jetbrains-mono, monospace)",
              fontSize: 12, fontWeight: 600,
              color: priceColor(s.rt),
            }}>
              {s.rt != null ? `$${fmtPrice(s.rt)}` : "—"}
            </span>
            {s.spread != null && (
              <span style={{
                fontSize: 10,
                fontFamily: "var(--font-jetbrains-mono, monospace)",
                color: s.spread > 0 ? "#fb7185" : "#34d399",
              }}>
                {s.spread > 0 ? "▲" : "▼"}{fmtPrice(Math.abs(s.spread))}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
