"use client";

import {
  ComposedChart,
  Line,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ReferenceLine,
} from "recharts";
import type { LMPPoint } from "@/lib/api";
import { fmtPrice, fmtTime } from "@/lib/format";

type ChartPoint = {
  ts: string;
  rt: number | null;
  da: number | null;
};

function buildChartData(rtPoints: LMPPoint[], daPoints: LMPPoint[]): ChartPoint[] {
  const map = new Map<string, ChartPoint>();
  for (const p of rtPoints) {
    map.set(p.ts, { ts: p.ts, rt: p.lmp, da: null });
  }
  for (const p of daPoints) {
    const existing = map.get(p.ts);
    if (existing) {
      existing.da = p.lmp;
    } else {
      map.set(p.ts, { ts: p.ts, rt: null, da: p.lmp });
    }
  }
  return [...map.values()].sort((a, b) => a.ts.localeCompare(b.ts));
}

function CustomTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ name: string; value: number | null; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const entries = payload.filter(p => p.value != null);
  if (!entries.length) return null;
  return (
    <div style={{
      background: "rgba(3,7,17,0.97)",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 10,
      padding: "10px 14px",
      fontSize: 12,
      backdropFilter: "blur(16px)",
    }}>
      <p style={{ color: "rgba(255,255,255,0.35)", marginBottom: 6, fontSize: 10, letterSpacing: "0.08em" }}>
        {label ? fmtTime(label) : ""}
      </p>
      {entries.map(p => (
        <div key={p.name} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: p.color, flexShrink: 0 }} />
          <span style={{ color: "rgba(255,255,255,0.45)", minWidth: 28, fontSize: 10 }}>{p.name}</span>
          <span style={{
            color: "#fff",
            fontFamily: "var(--font-jetbrains-mono, monospace)",
            fontWeight: 500,
          }}>
            ${fmtPrice(p.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

type Props = {
  rtPoints: LMPPoint[];
  daPoints: LMPPoint[];
  color: string;
};

export default function LMPChart({ rtPoints, daPoints, color }: Props) {
  const data = buildChartData(rtPoints, daPoints);

  if (!data.length) {
    return (
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        height: 260, color: "rgba(255,255,255,0.15)", fontSize: 13,
      }}>
        No data — prices collected on next 5-min interval
      </div>
    );
  }

  const allValues = data.flatMap(d => [d.rt, d.da]).filter((v): v is number => v != null);
  const hasNeg = allValues.some(v => v < 0);

  return (
    <div>
      <div style={{ display: "flex", gap: 16, marginBottom: 12, fontSize: 11, color: "rgba(255,255,255,0.35)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <span style={{ width: 16, height: 2, background: color, display: "inline-block", borderRadius: 1 }} />
          RT
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <span style={{
            width: 16, height: 0, display: "inline-block",
            borderTop: "2px dashed rgba(255,255,255,0.25)",
          }} />
          DA
        </div>
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <ComposedChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid
            strokeDasharray="2 6"
            stroke="rgba(255,255,255,0.04)"
            vertical={false}
          />
          <XAxis
            dataKey="ts"
            tickFormatter={fmtTime}
            tick={{ fontSize: 10, fill: "rgba(255,255,255,0.2)", fontFamily: "var(--font-jetbrains-mono, monospace)" }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
            tickMargin={8}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "rgba(255,255,255,0.2)", fontFamily: "var(--font-jetbrains-mono, monospace)" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `$${fmtPrice(v)}`}
            width={52}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: "rgba(255,255,255,0.06)", strokeWidth: 1 }} />
          {hasNeg && (
            <ReferenceLine y={0} stroke="rgba(255,255,255,0.12)" strokeWidth={1} />
          )}
          <Line
            type="monotone"
            dataKey="da"
            name="DA"
            stroke="rgba(255,255,255,0.25)"
            strokeWidth={1}
            strokeDasharray="4 4"
            dot={false}
            connectNulls
            activeDot={{ r: 3, fill: "rgba(255,255,255,0.5)", strokeWidth: 0 }}
          />
          <Line
            type="monotone"
            dataKey="rt"
            name="RT"
            stroke={color}
            strokeWidth={1.5}
            dot={false}
            connectNulls={false}
            activeDot={{ r: 3, fill: color, strokeWidth: 0 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
