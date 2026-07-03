import type {
  NatGasPrice,
  GasStoragePoint,
  TempPoint,
  CurtailmentSummary,
  ReserveMarginPoint,
} from "@/lib/api";

function Row({ name, value, sub, color }: { name: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="signal-row">
      <span className="signal-name">{name}</span>
      <span>
        <span className="signal-value" style={{ color: color ?? "var(--text)" }}>{value}</span>
        {sub && (
          <span className="signal-sub" style={{
            color: sub.startsWith("+") ? "#4ade80" : sub.startsWith("-") ? "#f87171" : "var(--text-muted)",
          }}>
            {sub}
          </span>
        )}
      </span>
    </div>
  );
}

function GasPanel({ natGas, storage }: { natGas: NatGasPrice[]; storage: GasStoragePoint[] }) {
  const henry = natGas.find(p => p.hub.toLowerCase().includes("henry")) ?? natGas[0];
  const price = henry?.price_usd ?? null;

  const usList = storage
    .filter(p => p.region.toLowerCase().includes("u.s") || p.region.toLowerCase() === "lower 48")
    .sort((a, b) => b.ts.localeCompare(a.ts));
  const storageCurrent = usList[0]?.bcf ?? null;
  const storagePrev    = usList[1]?.bcf ?? null;
  const storageWoW = storageCurrent != null && storagePrev != null
    ? storageCurrent - storagePrev : null;

  const otherHubs = natGas.filter(p => p !== henry).slice(0, 3);

  return (
    <div className="signal-card">
      <div className="signal-card-title">Natural gas</div>
      {henry && (
        <Row
          name={henry.hub}
          value={price != null ? `$${price.toFixed(2)}/MMBtu` : "—"}
          color={price != null && price > 4 ? "#fb923c" : price != null && price < 2 ? "#4ade80" : undefined}
        />
      )}
      {otherHubs.map(p => (
        <Row key={p.hub} name={p.hub} value={p.price_usd != null ? `$${p.price_usd.toFixed(2)}` : "—"} />
      ))}
      {storageCurrent != null && (
        <>
          <div style={{ borderTop: "1px solid var(--border-subtle)", marginTop: 8, paddingTop: 8 }} />
          <Row
            name="US storage"
            value={`${(storageCurrent / 1000).toFixed(3)} Tcf`}
            sub={storageWoW != null ? `${storageWoW > 0 ? "+" : ""}${storageWoW.toFixed(0)} Bcf WoW` : undefined}
          />
        </>
      )}
      {!henry && !storageCurrent && (
        <p className="signal-empty">No prices yet. First ingest runs daily at 06:00 UTC.</p>
      )}
    </div>
  );
}

function WeatherPanel({ weather }: { weather: TempPoint[] }) {
  const ISO_ORDER = ["NYISO", "PJM", "CAISO", "SPP", "ERCOT", "MISO", "ISONE"];
  const seen = new Set<string>();
  const latest: TempPoint[] = [];
  const sorted = [...weather].sort((a, b) => b.ts.localeCompare(a.ts));
  for (const p of sorted) {
    const key = `${p.iso}:${p.city}`;
    if (!seen.has(key)) { seen.add(key); latest.push(p); }
  }

  const byIso: Record<string, TempPoint[]> = {};
  for (const p of latest) (byIso[p.iso] ??= []).push(p);

  const isos = ISO_ORDER.filter(iso => byIso[iso]);

  if (!isos.length) {
    return (
      <div className="signal-card">
        <div className="signal-card-title">Temperatures</div>
        <p className="signal-empty">No readings yet. Updates hourly.</p>
      </div>
    );
  }

  return (
    <div className="signal-card">
      <div className="signal-card-title">Temperatures</div>
      {isos.map(iso => (
        <div key={iso} style={{ marginBottom: 10 }}>
          <div className="signal-group-label">{iso}</div>
          {byIso[iso].slice(0, 2).map(p => (
            <div key={p.city} className="signal-row">
              <span className="signal-name">{p.city}</span>
              <span className="signal-value" style={{ color: tempColor(p.temp_f) }}>
                {p.temp_f != null ? `${p.temp_f.toFixed(0)}°F` : "—"}
                {p.wind_mph != null && (
                  <span style={{ fontSize: 11, color: "var(--text-muted)", marginLeft: 4 }}>
                    {p.wind_mph.toFixed(0)} mph
                  </span>
                )}
              </span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function tempColor(f: number | null): string {
  if (f == null) return "var(--text-secondary)";
  if (f >= 95) return "#f87171";
  if (f >= 85) return "#fb923c";
  if (f >= 70) return "#fbbf24";
  if (f >= 50) return "var(--text)";
  if (f >= 32) return "#60a5fa";
  return "#a78bfa";
}

function CurtailmentPanel({
  curtailment,
  reserveMargins,
}: {
  curtailment: CurtailmentSummary[];
  reserveMargins: ReserveMarginPoint[];
}) {
  const hasCurt = curtailment.some(c => (c.total_30d_mwh ?? 0) > 0);
  const hasReserves = reserveMargins.length > 0;

  if (!hasCurt && !hasReserves) {
    return (
      <div className="signal-card">
        <div className="signal-card-title">Curtailment & reserves</div>
        <p className="signal-empty">No data yet. First ingest runs daily at 06:00 UTC.</p>
      </div>
    );
  }

  return (
    <div className="signal-card">
      {hasCurt && (
        <>
          <div className="signal-card-title">Curtailment (30-day)</div>
          {curtailment
            .filter(c => (c.total_30d_mwh ?? 0) > 0)
            .sort((a, b) => (b.total_30d_mwh ?? 0) - (a.total_30d_mwh ?? 0))
            .map(c => (
              <div key={c.iso} style={{ marginBottom: 8 }}>
                <Row name={c.iso} value={fmtGwh(c.total_30d_mwh)} />
                <div style={{ display: "flex", gap: 10, fontSize: 11, color: "var(--text-muted)", paddingLeft: 2 }}>
                  {(c.solar_30d_mwh ?? 0) > 0 && <span>Solar {fmtGwh(c.solar_30d_mwh)}</span>}
                  {(c.wind_30d_mwh ?? 0) > 0  && <span>Wind {fmtGwh(c.wind_30d_mwh)}</span>}
                </div>
              </div>
            ))}
        </>
      )}
      {hasReserves && (
        <>
          {hasCurt && <div style={{ borderTop: "1px solid var(--border-subtle)", margin: "12px 0" }} />}
          <div className="signal-card-title" style={{ marginTop: hasCurt ? 0 : undefined }}>Reserve margins</div>
          {reserveMargins.map(r => (
            <Row
              key={r.iso}
              name={r.iso}
              value={r.actual_pct != null ? `${r.actual_pct.toFixed(1)}%` : "—"}
              sub={r.required_pct != null ? `req ${r.required_pct.toFixed(1)}%` : undefined}
              color={
                r.actual_pct != null && r.required_pct != null
                  ? r.actual_pct < r.required_pct ? "#f87171" : "#4ade80"
                  : undefined
              }
            />
          ))}
        </>
      )}
    </div>
  );
}

function fmtGwh(mwh: number | null): string {
  if (mwh == null) return "—";
  if (mwh >= 1_000_000) return `${(mwh / 1_000_000).toFixed(1)} TWh`;
  if (mwh >= 1_000)     return `${(mwh / 1_000).toFixed(1)} GWh`;
  return `${mwh.toFixed(0)} MWh`;
}

type Props = {
  natGas: NatGasPrice[];
  gasStorage: GasStoragePoint[];
  weather: TempPoint[];
  curtailment: CurtailmentSummary[];
  reserveMargins: ReserveMarginPoint[];
};

export default function MarketSignals({ natGas, gasStorage, weather, curtailment, reserveMargins }: Props) {
  const hasAny = natGas.length > 0 || gasStorage.length > 0 || weather.length > 0 || curtailment.length > 0 || reserveMargins.length > 0;
  if (!hasAny) return null;

  return (
    <div className="signals-grid">
      <GasPanel natGas={natGas} storage={gasStorage} />
      <WeatherPanel weather={weather} />
      <CurtailmentPanel curtailment={curtailment} reserveMargins={reserveMargins} />
    </div>
  );
}
