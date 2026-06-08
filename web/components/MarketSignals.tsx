import type {
  NatGasPrice,
  GasStoragePoint,
  TempPoint,
  CurtailmentSummary,
  ReserveMarginPoint,
} from "@/lib/api";

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 9, fontWeight: 700, letterSpacing: "0.14em",
      color: "rgba(255,255,255,0.22)", marginBottom: 12,
      fontFamily: "var(--font-jetbrains-mono, monospace)",
    }}>
      {children}
    </div>
  );
}

function Row({ name, value, sub, color }: { name: string; value: string; sub?: string; color?: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
      <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>{name}</span>
      <span style={{ textAlign: "right" }}>
        <span style={{
          fontSize: 13, fontFamily: "var(--font-jetbrains-mono, monospace)",
          fontWeight: 600, color: color ?? "rgba(255,255,255,0.75)",
        }}>
          {value}
        </span>
        {sub && (
          <span style={{
            fontSize: 10, marginLeft: 5,
            fontFamily: "var(--font-jetbrains-mono, monospace)",
            color: sub.startsWith("+") ? "#34d399" : sub.startsWith("-") ? "#fb7185" : "rgba(255,255,255,0.3)",
          }}>
            {sub}
          </span>
        )}
      </span>
    </div>
  );
}

// ── Gas panel ────────────────────────────────────────────────────────

function GasPanel({ natGas, storage }: { natGas: NatGasPrice[]; storage: GasStoragePoint[] }) {
  const henry = natGas.find(p => p.hub.toLowerCase().includes("henry")) ?? natGas[0];
  const price = henry?.price_usd ?? null;

  // Get US total storage: latest two readings for WoW change
  const usList = storage
    .filter(p => p.region.toLowerCase().includes("u.s") || p.region.toLowerCase() === "lower 48")
    .sort((a, b) => b.ts.localeCompare(a.ts));
  const storageCurrent = usList[0]?.bcf ?? null;
  const storagePrev    = usList[1]?.bcf ?? null;
  const storageWoW = storageCurrent != null && storagePrev != null
    ? storageCurrent - storagePrev : null;

  // All hubs
  const otherHubs = natGas.filter(p => p !== henry).slice(0, 3);

  return (
    <div className="signals-card">
      <Label>NATURAL GAS</Label>
      {henry && (
        <Row
          name={henry.hub}
          value={price != null ? `$${price.toFixed(2)}/MMBtu` : "—"}
          color={price != null && price > 4 ? "#f97316" : price != null && price < 2 ? "#34d399" : undefined}
        />
      )}
      {otherHubs.map(p => (
        <Row key={p.hub} name={p.hub} value={p.price_usd != null ? `$${p.price_usd.toFixed(2)}` : "—"} />
      ))}
      {storageCurrent != null && (
        <>
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", marginTop: 10, paddingTop: 10 }} />
          <Row
            name="US Storage"
            value={`${(storageCurrent / 1000).toFixed(3)} Tcf`}
            sub={storageWoW != null ? `${storageWoW > 0 ? "+" : ""}${storageWoW.toFixed(0)} Bcf WoW` : undefined}
          />
        </>
      )}
      {!henry && !storageCurrent && (
        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.15)" }}>Ingesting daily at 06:00 UTC</p>
      )}
    </div>
  );
}

// ── Weather panel ─────────────────────────────────────────────────────

function WeatherPanel({ weather }: { weather: TempPoint[] }) {
  const ISO_ORDER = ["NYISO", "PJM", "CAISO", "SPP", "ERCOT", "MISO", "ISONE"];
  // Latest per ISO+city
  const seen = new Set<string>();
  const latest: TempPoint[] = [];
  const sorted = [...weather].sort((a, b) => b.ts.localeCompare(a.ts));
  for (const p of sorted) {
    const key = `${p.iso}:${p.city}`;
    if (!seen.has(key)) { seen.add(key); latest.push(p); }
  }

  const byIso: Record<string, TempPoint[]> = {};
  for (const p of latest) {
    (byIso[p.iso] ??= []).push(p);
  }

  const isos = ISO_ORDER.filter(iso => byIso[iso]);

  if (!isos.length) {
    return (
      <div className="signals-card">
        <Label>GRID TEMPERATURES</Label>
        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.15)" }}>Ingesting hourly</p>
      </div>
    );
  }

  return (
    <div className="signals-card">
      <Label>GRID TEMPERATURES</Label>
      {isos.map(iso => (
        <div key={iso} style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 9, color: "rgba(255,255,255,0.2)", letterSpacing: "0.1em", marginBottom: 4, fontFamily: "var(--font-jetbrains-mono, monospace)" }}>
            {iso}
          </div>
          {byIso[iso].slice(0, 2).map(p => (
            <div key={p.city} style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>{p.city}</span>
              <span style={{
                fontSize: 11, fontFamily: "var(--font-jetbrains-mono, monospace)",
                color: tempColor(p.temp_f),
              }}>
                {p.temp_f != null ? `${p.temp_f.toFixed(0)}°F` : "—"}
                {p.wind_mph != null && (
                  <span style={{ fontSize: 9, color: "rgba(255,255,255,0.2)", marginLeft: 4 }}>
                    {p.wind_mph.toFixed(0)}mph
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
  if (f == null) return "rgba(255,255,255,0.4)";
  if (f >= 95) return "#ef4444";
  if (f >= 85) return "#f97316";
  if (f >= 70) return "#fbbf24";
  if (f >= 50) return "rgba(255,255,255,0.65)";
  if (f >= 32) return "#38bdf8";
  return "#a78bfa";
}

// ── Curtailment + reserves panel ──────────────────────────────────────

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
      <div className="signals-card">
        <Label>CURTAILMENT & RESERVES</Label>
        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.15)" }}>Ingesting daily at 06:00 UTC</p>
      </div>
    );
  }

  return (
    <div className="signals-card">
      {hasCurt && (
        <>
          <Label>CURTAILMENT (30-DAY)</Label>
          {curtailment
            .filter(c => (c.total_30d_mwh ?? 0) > 0)
            .sort((a, b) => (b.total_30d_mwh ?? 0) - (a.total_30d_mwh ?? 0))
            .map(c => (
              <div key={c.iso} style={{ marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 3 }}>
                  <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>{c.iso}</span>
                  <span style={{
                    fontSize: 12, fontFamily: "var(--font-jetbrains-mono, monospace)",
                    color: "rgba(255,255,255,0.6)",
                  }}>
                    {fmtGwh(c.total_30d_mwh)}
                  </span>
                </div>
                <div style={{ display: "flex", gap: 8, fontSize: 9, color: "rgba(255,255,255,0.2)", fontFamily: "var(--font-jetbrains-mono, monospace)" }}>
                  {(c.solar_30d_mwh ?? 0) > 0 && <span>☀ {fmtGwh(c.solar_30d_mwh)}</span>}
                  {(c.wind_30d_mwh ?? 0) > 0  && <span>⟲ {fmtGwh(c.wind_30d_mwh)}</span>}
                </div>
              </div>
            ))}
        </>
      )}

      {hasReserves && (
        <>
          {hasCurt && <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", marginTop: 10, paddingTop: 10 }} />}
          <Label>RESERVE MARGINS</Label>
          {reserveMargins.map(r => (
            <Row
              key={r.iso}
              name={r.iso}
              value={r.actual_pct != null ? `${r.actual_pct.toFixed(1)}%` : "—"}
              sub={r.required_pct != null ? `req ${r.required_pct.toFixed(1)}%` : undefined}
              color={
                r.actual_pct != null && r.required_pct != null
                  ? r.actual_pct < r.required_pct ? "#fb7185" : "#34d399"
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

// ── Main export ───────────────────────────────────────────────────────

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
    <div style={{ marginBottom: 48 }}>
      <div style={{
        fontSize: 9, fontWeight: 700, letterSpacing: "0.18em",
        color: "rgba(255,255,255,0.18)", marginBottom: 14,
        fontFamily: "var(--font-jetbrains-mono, monospace)",
      }}>
        MARKET CONTEXT
      </div>
      <div className="signals-grid">
        <GasPanel natGas={natGas} storage={gasStorage} />
        <WeatherPanel weather={weather} />
        <CurtailmentPanel curtailment={curtailment} reserveMargins={reserveMargins} />
      </div>
    </div>
  );
}
