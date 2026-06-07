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
        marginBottom: 40,
        padding: "28px 32px",
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 20,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", color, textTransform: "uppercase" }}>
            {label}
          </span>
        </div>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.2)" }}>
          Awaiting first ingest — prices will appear within the next collection interval.
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
      marginBottom: 40,
      background: "rgba(255,255,255,0.02)",
      border: "1px solid rgba(255,255,255,0.06)",
      borderRadius: 20,
      overflow: "hidden",
    }}>
      {/* Header: label + hub tabs */}
      <div style={{
        padding: "18px 28px 0",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        display: "flex",
        alignItems: "center",
        gap: 20,
      }}>
        <span style={{
          fontSize: 11, fontWeight: 700, letterSpacing: "0.14em",
          color, textTransform: "uppercase", flexShrink: 0,
        }}>
          {label}
        </span>
        <div style={{ display: "flex", gap: 4, overflowX: "auto", paddingBottom: 16 }}>
          {hubs.map((h, i) => (
            <button
              key={h.node_id}
              onClick={() => setIdx(i)}
              style={{
                padding: "5px 12px",
                borderRadius: 999,
                fontSize: 11,
                fontWeight: idx === i ? 600 : 400,
                border: idx === i ? `1px solid ${color}55` : "1px solid rgba(255,255,255,0.07)",
                background: idx === i ? `${color}15` : "transparent",
                color: idx === i ? color : "rgba(255,255,255,0.35)",
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "all 0.12s",
              }}
            >
              {h.node_name}
            </button>
          ))}
        </div>
      </div>

      {/* Body: stats panel + chart */}
      <div style={{ display: "flex" }}>
        {/* Stats panel */}
        <div style={{
          width: 216,
          flexShrink: 0,
          padding: "22px 24px",
          borderRight: "1px solid rgba(255,255,255,0.05)",
        }}>
          {/* RT now */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", letterSpacing: "0.1em", marginBottom: 5 }}>
              RT NOW
            </div>
            <div style={{
              fontSize: 40, fontWeight: 700, lineHeight: 1,
              fontFamily: "var(--font-jetbrains-mono, monospace)",
              color: priceColor(rtLmp),
            }}>
              {rtLmp != null ? `$${fmtPrice(rtLmp)}` : "—"}
            </div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.18)", marginTop: 3 }}>/MWh</div>
          </div>

          {/* DA + spread */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", letterSpacing: "0.1em" }}>DA</span>
              <span style={{
                fontSize: 15,
                fontFamily: "var(--font-jetbrains-mono, monospace)",
                color: "rgba(255,255,255,0.55)",
              }}>
                {daLmp != null ? `$${fmtPrice(daLmp)}` : "—"}
              </span>
            </div>
            {spread != null && (
              <div style={{
                fontSize: 11,
                textAlign: "right",
                color: spread > 0 ? "#fb7185" : "#34d399",
              }}>
                {spread > 0 ? "+" : ""}{fmtPrice(spread)} vs DA
              </div>
            )}
          </div>

          {/* 24h high / low / avg */}
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 14, marginBottom: 2 }}>
            {[
              { label: "24h HIGH", value: high24, color: "#ef4444" },
              { label: "24h LOW",  value: low24,  color: "#34d399" },
              { label: "24h AVG",  value: avg24,  color: "rgba(255,255,255,0.45)" },
            ].map(({ label: l, value, color: c }) => (
              <div key={l} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 7 }}>
                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.22)", letterSpacing: "0.08em" }}>{l}</span>
                <span style={{ fontSize: 11, fontFamily: "var(--font-jetbrains-mono, monospace)", color: c }}>
                  {value != null ? `$${fmtPrice(value)}` : "—"}
                </span>
              </div>
            ))}
          </div>

          {/* Component breakdown */}
          <ComponentsBar point={latestRT} />

          {/* Timestamp */}
          {latestRT && (
            <div style={{ marginTop: 14, fontSize: 9, color: "rgba(255,255,255,0.12)", lineHeight: 1.4 }}>
              {fmtTimestamp(latestRT.ts)}
            </div>
          )}
        </div>

        {/* Chart */}
        <div style={{ flex: 1, padding: "22px 20px 16px" }}>
          <LMPChart rtPoints={hub.rtPoints} daPoints={hub.daPoints} color={color} />
        </div>
      </div>
    </div>
  );
}
