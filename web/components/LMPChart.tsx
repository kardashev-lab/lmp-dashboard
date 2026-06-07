"use client";

import {
  ComposedChart,
  Area,
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
      border: "1px solid rgba(255,255,255,0.09)",
      borderRadius: 10,
      padding: "10px 14px",
      backdropFilter: "blur(16px)",
    }}>
      <p style={{
        color: "rgba(255,255,255,0.35)", marginBottom: 7,
        fontSize: 10, letterSpacing: "0.08em",
        fontFamily: "var(--font-jetbrains-mono, monospace)",
      }}>
        {label ? fmtTime(label) : ""}
      </p>
      {entries.map(p => (
        <div key={p.name} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: p.color, flexShrink: 0 }} />
          <span style={{ color: "rgba(255,255,255,0.4)", minWidth: 28, fontSize: 10, fontFamily: "var(--font-jetbrains-mono, monospace)" }}>
            {p.name}
          </span>
          <span style={{
            color: "#fff",
            fontFamily: "var(--font-jetbrains-mono, monospace)",
            fontSize: 12, fontWeight: 600,
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
  const gradId = `grad-${color.replace("#", "")}`;

  if (!data.length) {
    return (
      <div className="chart-container" style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "rgba(255,255,255,0.15)", fontSize: 12,
        fontFamily: "var(--font-jetbrains-mono, monospace)",
      }}>
        awaiting data — next 5-min interval
      </div>
    );
  }

  const allValues = data.flatMap(d => [d.rt, d.da]).filter((v): v is number => v != null);
  const hasNeg = allValues.some(v => v < 0);

  return (
    <div>
      <div style={{ display: "flex", gap: 16, marginBottom: 10, fontSize: 10, color: "rgba(255,255,255,0.3)", fontFamily: "var(--font-jetbrains-mono, monospace)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <span style={{ width: 16, height: 2, background: color, display: "inline-block", borderRadius: 1 }} />
          RT
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <span style={{ width: 16, height: 0, display: "inline-block", borderTop: "2px dashed rgba(255,255,255,0.25)" }} />
          DA
        </div>
      </div>
      <div className="chart-container">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.18} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="2 8"
              stroke="rgba(255,255,255,0.035)"
              vertical={false}
            />
            <XAxis
              dataKey="ts"
              tickFormatter={fmtTime}
              tick={{ fontSize: 9, fill: "rgba(255,255,255,0.18)", fontFamily: "var(--font-jetbrains-mono, monospace)" }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
              tickMargin={8}
            />
            <YAxis
              tick={{ fontSize: 9, fill: "rgba(255,255,255,0.18)", fontFamily: "var(--font-jetbrains-mono, monospace)" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `$${fmtPrice(v)}`}
              width={50}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: "rgba(255,255,255,0.07)", strokeWidth: 1 }} />
            {hasNeg && (
              <ReferenceLine y={0} stroke="rgba(255,255,255,0.1)" strokeWidth={1} strokeDasharray="3 3" />
            )}
            {/* DA line */}
            <Line
              type="monotone"
              dataKey="da"
              name="DA"
              stroke="rgba(255,255,255,0.22)"
              strokeWidth={1}
              strokeDasharray="4 4"
              dot={false}
              connectNulls
              activeDot={{ r: 3, fill: "rgba(255,255,255,0.5)", strokeWidth: 0 }}
            />
            {/* RT gradient fill */}
            <Area
              type="monotone"
              dataKey="rt"
              fill={`url(#${gradId})`}
              stroke="none"
              dot={false}
              connectNulls={false}
              isAnimationActive={false}
            />
            {/* RT line on top */}
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
    </div>
  );
}
