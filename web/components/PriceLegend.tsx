import { LMP_BUCKETS } from "@/lib/format";

export default function PriceLegend() {
  return (
    <div className="price-legend">
      <span className="price-legend-title">LMP scale</span>
      <div className="price-legend-items">
        {LMP_BUCKETS.map(b => (
          <div key={b.label} className="price-legend-item">
            <span className="price-legend-swatch" style={{ background: b.bg }} />
            <span>{b.label}</span>
          </div>
        ))}
        <div className="price-legend-item">
          <span className="price-legend-swatch" style={{ background: "#4c1d95" }} />
          <span>Negative</span>
        </div>
      </div>
    </div>
  );
}
