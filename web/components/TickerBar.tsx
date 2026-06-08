import { fmtPrice, priceColor, spreadColor, fmtChange } from "@/lib/format";

type TickerStat = {
  iso: string;
  label: string;
  rt: number | null;
  spread: number | null;
};

export default function TickerBar({ stats }: { stats: TickerStat[] }) {
  const items: TickerStat[] = Array(8).fill(null).flatMap(() => stats);

  return (
    <div className="ticker-wrap">
      <div className="ticker-inner">
        {items.map((s, i) => (
          <div key={i} className="ticker-item">
            <span className="ticker-symbol">{s.label}</span>
            <span className="ticker-price" style={{ color: priceColor(s.rt) }}>
              {s.rt != null ? `$${fmtPrice(s.rt)}` : "—"}
            </span>
            {s.spread != null && (
              <span className="ticker-chg" style={{ color: spreadColor(s.spread) }}>
                {s.spread > 0 ? "▲" : s.spread < 0 ? "▼" : "—"}
                {fmtChange(Math.abs(s.spread))}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
