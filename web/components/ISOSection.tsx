"use client";

import { useEffect, useRef, useState } from "react";
import type { HubData, LMPPoint, FuelMixPoint, BatteryPoint, ReserveMarginPoint } from "@/lib/api";
import { fmtPrice, fmtTimestamp, lmpBucket, spreadColor, fmtChange } from "@/lib/format";
import LMPChart from "./LMPChart";
import ComponentsBar from "./ComponentsBar";
import FuelMixBar from "./FuelMixBar";

type Props = {
  iso: string;
  label: string;
  color: string;
  hubs: HubData[];
  fuelMix?: FuelMixPoint[];
  currentLoad?: number | null;
  battery?: BatteryPoint[];
  reserveMargin?: ReserveMarginPoint | null;
};

type Series = { rtPoints: LMPPoint[]; daPoints: LMPPoint[] };

export default function ISOSection({
  iso, label, color, hubs,
  fuelMix = [], currentLoad, battery, reserveMargin,
}: Props) {
  const [idx, setIdx] = useState(0);
  // Series for hubs that weren't fetched during SSR, loaded on selection.
  const [lazySeries, setLazySeries] = useState<Record<string, Series>>({});
  const [seriesLoading, setSeriesLoading] = useState(false);
  const pending = useRef<string | null>(null);

  const selected = hubs[Math.min(idx, Math.max(hubs.length - 1, 0))];
  const needsFetch = selected && !selected.loaded && !lazySeries[selected.node_id];

  useEffect(() => {
    if (!needsFetch || pending.current === selected.node_id) return;
    pending.current = selected.node_id;
    setSeriesLoading(true);
    fetch(`/api/lmp?iso=${iso}&node_id=${encodeURIComponent(selected.node_id)}`)
      .then(res => (res.ok ? res.json() : null))
      .then((data: Series | null) => {
        if (data) setLazySeries(prev => ({ ...prev, [selected.node_id]: data }));
      })
      .catch(() => {})
      .finally(() => {
        if (pending.current === selected.node_id) {
          pending.current = null;
          setSeriesLoading(false);
        }
      });
  }, [needsFetch, selected, iso]);

  if (!hubs.length) {
    return (
      <div className="iso-panel">
        <div className="iso-panel-header">
          <span className="iso-panel-title" style={{ color }}>{label}</span>
          <span className="iso-panel-meta">Awaiting data</span>
        </div>
        <div style={{ padding: 24, color: "var(--text-muted)", fontSize: 13 }}>
          Prices will appear after the next 5-minute ingest interval.
        </div>
      </div>
    );
  }

  const baseHub = hubs[Math.min(idx, hubs.length - 1)];
  const lazy = lazySeries[baseHub.node_id];
  const hub: HubData = baseHub.loaded || !lazy
    ? baseHub
    : { ...baseHub, rtPoints: lazy.rtPoints, daPoints: lazy.daPoints, loaded: true };
  const latestRT = hub.rtPoints[hub.rtPoints.length - 1] ?? null;
  const latestDA = hub.daPoints[hub.daPoints.length - 1] ?? null;

  const rtLmp = latestRT?.lmp ?? null;
  const daLmp = latestDA?.lmp ?? null;
  const spread = rtLmp != null && daLmp != null ? rtLmp - daLmp : null;
  const bucket = lmpBucket(rtLmp);

  const rtPrices = hub.rtPoints.map(p => p.lmp).filter((v): v is number => v != null);
  const high24 = rtPrices.length ? Math.max(...rtPrices) : null;
  const low24  = rtPrices.length ? Math.min(...rtPrices) : null;
  const avg24  = rtPrices.length ? rtPrices.reduce((a, b) => a + b, 0) / rtPrices.length : null;

  const latestBattery = battery?.length ? battery[battery.length - 1] : null;

  return (
    <div className="iso-panel">
      <div className="iso-panel-header">
        <span className="iso-panel-title" style={{ color }}>{label}</span>
        <span className="iso-panel-meta">
          {hubs.length} node{hubs.length !== 1 ? "s" : ""}
          {currentLoad != null && ` · ${(currentLoad / 1000).toFixed(1)} GW load`}
        </span>
      </div>

      <div className="iso-panel-body">
        <aside className="iso-sidebar">
          <div className="hub-select">
            {hubs.map((h, i) => (
              <button
                key={h.node_id}
                onClick={() => setIdx(i)}
                className={`hub-pill${idx === i ? " active" : ""}`}
                style={idx === i ? { background: `${color}18`, color, borderColor: `${color}40` } : undefined}
              >
                {h.node_name}
              </button>
            ))}
          </div>

          <div className="stat-hero">
            <div className="stat-hero-label">Real-time LMP</div>
            <div
              className="stat-hero-price"
              style={{ color: bucket.text, background: bucket.bg, borderRadius: 6, padding: "6px 10px", display: "inline-block" }}
            >
              {rtLmp != null ? `$${fmtPrice(rtLmp)}` : "—"}
            </div>
            <div className="stat-hero-unit">$/MWh · {bucket.label}</div>
          </div>

          <div className="stat-list">
            <div className="stat-item">
              <span className="stat-item-label">Day-ahead</span>
              <span className="stat-item-value" style={{ color: "var(--text-secondary)" }}>
                {daLmp != null ? `$${fmtPrice(daLmp)}` : "—"}
              </span>
            </div>
            {spread != null && (
              <div className="stat-item">
                <span className="stat-item-label">DART spread</span>
                <span className="stat-item-value" style={{ color: spreadColor(spread) }}>
                  {fmtChange(spread)}
                </span>
              </div>
            )}
            {[
              { label: "24h high", value: high24, clr: "#f87171" },
              { label: "24h low",  value: low24,  clr: "#4ade80" },
              { label: "24h avg",  value: avg24,  clr: "var(--text-secondary)" },
            ].map(({ label: l, value, clr }) => (
              <div key={l} className="stat-item">
                <span className="stat-item-label">{l}</span>
                <span className="stat-item-value" style={{ color: clr }}>
                  {value != null ? `$${fmtPrice(value)}` : "—"}
                </span>
              </div>
            ))}
          </div>

          <ComponentsBar point={latestRT} />
          {fuelMix.length > 0 && <FuelMixBar fuelMix={fuelMix} />}

          {latestBattery && (
            <div className="stat-section">
              <div className="stat-section-title">Battery storage</div>
              {[
                { label: "Discharging", value: latestBattery.mw_discharging, unit: "MW", color: "#4ade80" },
                { label: "Charging",    value: latestBattery.mw_charging,    unit: "MW", color: "#f87171" },
                { label: "State",       value: latestBattery.mwh_state,       unit: "MWh", color: "var(--text-secondary)" },
              ].map(({ label: l, value, unit, color: c }) => value != null && (
                <div key={l} className="stat-item">
                  <span className="stat-item-label">{l}</span>
                  <span className="stat-item-value" style={{ color: c }}>
                    {value.toFixed(0)} {unit}
                  </span>
                </div>
              ))}
            </div>
          )}

          {reserveMargin && (
            <div className="stat-section">
              <div className="stat-section-title">Reserve margin</div>
              <div className="stat-item">
                <span className="stat-item-label">Actual</span>
                <span className="stat-item-value" style={{
                  color: reserveMargin.actual_pct != null && reserveMargin.required_pct != null
                    ? reserveMargin.actual_pct < reserveMargin.required_pct ? "#f87171" : "#4ade80"
                    : "var(--text-secondary)",
                }}>
                  {reserveMargin.actual_pct != null ? `${reserveMargin.actual_pct.toFixed(1)}%` : "—"}
                </span>
              </div>
              {reserveMargin.required_pct != null && (
                <div className="stat-item">
                  <span className="stat-item-label">Required</span>
                  <span className="stat-item-value" style={{ color: "var(--text-muted)" }}>
                    {reserveMargin.required_pct.toFixed(1)}%
                  </span>
                </div>
              )}
            </div>
          )}

          {latestRT && (
            <div style={{ marginTop: 14, fontSize: 11, color: "var(--text-muted)" }}>
              Updated {fmtTimestamp(latestRT.ts)}
            </div>
          )}
        </aside>

        <div className="iso-main">
          {seriesLoading && !hub.rtPoints.length ? (
            <div className="chart-loading">Loading {hub.node_name}…</div>
          ) : (
            <LMPChart rtPoints={hub.rtPoints} daPoints={hub.daPoints} color={color} />
          )}
        </div>
      </div>
    </div>
  );
}
