"use client";

import { useState } from "react";
import type { HubData } from "@/lib/api";
import { fmtPrice, fmtTimestamp, priceColor } from "@/lib/format";
import LMPChart from "./LMPChart";
import ComponentsBar from "./ComponentsBar";

type Props = {
  iso: string;
  label: string;
  color: string;
  hubs: HubData[];
};

export default function ISOSection({ iso: _iso, label, color, hubs }: Props) {
  const [idx, setIdx] = useState(0);

  if (!hubs.length) {
    return (
      <div style={{
        marginBottom: 32,
        padding: "24px 28px",
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 18,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", color, textTransform: "uppercase" }}>
            {label}
          </span>
        </div>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.2)" }}>
          Awaiting first ingest — prices appear within the next 5-min interval.
        </p>
      </div>
    );
  }

  const hub = hubs[Math.min(idx, hubs.length - 1)];
  const latestRT = hub.rtPoints[hub.rtPoints.length - 1] ?? null;
  const latestDA = hub.daPoints[hub.daPoints.length - 1] ?? null;

  const rtLmp = latestRT?.lmp ?? null;
  const daLmp = latestDA?.lmp ?? null;
  const spread = rtLmp != null && daLmp != null ? rtLmp - daLmp : null;

  const rtPrices = hub.rtPoints.map(p => p.lmp).filter((v): v is number => v != null);
  const high24 = rtPrices.length ? Math.max(...rtPrices) : null;
  const low24  = rtPrices.length ? Math.min(...rtPrices) : null;
  const avg24  = rtPrices.length ? rtPrices.reduce((a, b) => a + b, 0) / rtPrices.length : null;

  return (
    <div style={{
      marginBottom: 32,
      background: "rgba(255,255,255,0.02)",
      border: "1px solid rgba(255,255,255,0.06)",
      borderRadius: 18,
      overflow: "hidden",
    }}>
      {/* Section header */}
      <div style={{
        padding: "14px 24px 0",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
      }}>
        {/* Top row: label + metadata + divider */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <span style={{
            fontSize: 10, fontWeight: 700, letterSpacing: "0.16em",
            color, textTransform: "uppercase", flexShrink: 0,
          }}>
            {label}
          </span>
          <span style={{
            fontSize: 9, color: "rgba(255,255,255,0.2)", letterSpacing: "0.1em",
            fontFamily: "var(--font-jetbrains-mono, monospace)",
          }}>
            {hubs.length} NODE{hubs.length !== 1 ? "S" : ""}
          </span>
          <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.04)" }} />
          <span style={{
            fontSize: 9, color: "rgba(255,255,255,0.18)", letterSpacing: "0.1em",
            fontFamily: "var(--font-jetbrains-mono, monospace)",
          }}>
            RT MARKET
          </span>
        </div>

        {/* Hub tabs */}
        <div style={{ display: "flex", gap: 4, overflowX: "auto", paddingBottom: 12 }}>
          {hubs.map((h, i) => (
            <button
              key={h.node_id}
              onClick={() => setIdx(i)}
              style={{
                padding: "4px 11px",
                borderRadius: 999,
                fontSize: 10,
                fontWeight: idx === i ? 600 : 400,
                border: idx === i ? `1px solid ${color}50` : "1px solid rgba(255,255,255,0.07)",
                background: idx === i ? `${color}15` : "transparent",
                color: idx === i ? color : "rgba(255,255,255,0.3)",
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "all 0.12s",
                fontFamily: "var(--font-jetbrains-mono, monospace)",
              }}
            >
              {h.node_name}
            </button>
          ))}
        </div>
      </div>

      {/* Body: stats + chart */}
      <div className="iso-body">
        {/* Stats panel */}
        <div className="iso-stats">
          {/* RT price */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.22)", letterSpacing: "0.12em", marginBottom: 6, fontFamily: "var(--font-jetbrains-mono, monospace)" }}>
              RT NOW
            </div>
            <div style={{
              fontSize: 38, fontWeight: 700, lineHeight: 1,
              fontFamily: "var(--font-jetbrains-mono, monospace)",
              color: priceColor(rtLmp),
            }}>
              {rtLmp != null ? `$${fmtPrice(rtLmp)}` : "—"}
            </div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.18)", marginTop: 3, fontFamily: "var(--font-jetbrains-mono, monospace)" }}>/MWh</div>
          </div>

          {/* DA + spread */}
          <div style={{ marginBottom: 16, paddingBottom: 14, borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 5 }}>
              <span style={{ fontSize: 9, color: "rgba(255,255,255,0.22)", letterSpacing: "0.12em", fontFamily: "var(--font-jetbrains-mono, monospace)" }}>
                DA
              </span>
              <span style={{ fontSize: 14, fontFamily: "var(--font-jetbrains-mono, monospace)", color: "rgba(255,255,255,0.5)" }}>
                {daLmp != null ? `$${fmtPrice(daLmp)}` : "—"}
              </span>
            </div>
            {spread != null && (
              <div style={{
                fontSize: 11, textAlign: "right",
                fontFamily: "var(--font-jetbrains-mono, monospace)",
                color: spread > 0 ? "#fb7185" : "#34d399",
              }}>
                {spread > 0 ? "▲" : "▼"} {spread > 0 ? "+" : ""}{fmtPrice(spread)} vs DA
              </div>
            )}
          </div>

          {/* 24h stats */}
          <div style={{ marginBottom: 2 }}>
            {[
              { label: "24H HIGH", value: high24, clr: "#ef4444" },
              { label: "24H LOW",  value: low24,  clr: "#34d399" },
              { label: "24H AVG",  value: avg24,  clr: "rgba(255,255,255,0.4)" },
            ].map(({ label: l, value, clr }) => (
              <div key={l} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 7 }}>
                <span style={{ fontSize: 9, color: "rgba(255,255,255,0.2)", letterSpacing: "0.1em", fontFamily: "var(--font-jetbrains-mono, monospace)" }}>
                  {l}
                </span>
                <span style={{ fontSize: 11, fontFamily: "var(--font-jetbrains-mono, monospace)", color: clr }}>
                  {value != null ? `$${fmtPrice(value)}` : "—"}
                </span>
              </div>
            ))}
          </div>

          <ComponentsBar point={latestRT} />

          {latestRT && (
            <div style={{ marginTop: 14, fontSize: 9, color: "rgba(255,255,255,0.15)", fontFamily: "var(--font-jetbrains-mono, monospace)" }}>
              {fmtTimestamp(latestRT.ts)}
            </div>
          )}
        </div>

        {/* Chart */}
        <div className="iso-chart">
          <LMPChart rtPoints={hub.rtPoints} daPoints={hub.daPoints} color={color} />
        </div>
      </div>
    </div>
  );
}
