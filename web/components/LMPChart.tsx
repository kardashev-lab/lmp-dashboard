"use client";

import { useEffect, useState } from "react";
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
    if (existing) existing.da = p.lmp;
    else map.set(p.ts, { ts: p.ts, rt: null, da: p.lmp });
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
      background: "#1c2430",
      border: "1px solid #2a3441",
      borderRadius: 8,
      padding: "10px 14px",
      boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
    }}>
      <p style={{ color: "#64748b", marginBottom: 8, fontSize: 11 }}>
        {label ? `${fmtTime(label)} UTC` : ""}
      </p>
      {entries.map(p => (
        <div key={p.name} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <span style={{ width: 8, height: 3, background: p.color, borderRadius: 1 }} />
          <span style={{ color: "#94a3b8", minWidth: 24, fontSize: 12 }}>{p.name}</span>
          <span style={{ color: "#e8edf4", fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 600 }}>
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

function useChartInsets() {
  const [insets, setInsets] = useState({ left: 4, yWidth: 56 });
  useEffect(() => {
    const update = () => {
      setInsets(
        window.innerWidth < 768 ? { left: 12, yWidth: 72 } : { left: 4, yWidth: 56 },
      );
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return insets;
}

export default function LMPChart({ rtPoints, daPoints, color }: Props) {
  const data = buildChartData(rtPoints, daPoints);
  const gradId = `grad-${color.replace("#", "")}`;
  const { left, yWidth } = useChartInsets();

  if (!data.length) {
    return (
      <div className="chart-container chart-empty">
        Awaiting data — next 5-minute interval
      </div>
    );
  }

  const allValues = data.flatMap(d => [d.rt, d.da]).filter((v): v is number => v != null);
  const hasNeg = allValues.some(v => v < 0);

  return (
    <div>
      <div className="chart-legend">
        <div className="chart-legend-item">
          <span style={{ width: 18, height: 3, background: color, borderRadius: 1, display: "inline-block" }} />
          Real-time
        </div>
        <div className="chart-legend-item">
          <span style={{ width: 18, height: 0, display: "inline-block", borderTop: "2px dashed #64748b" }} />
          Day-ahead
        </div>
      </div>
      <div className="chart-container">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 8, right: 12, left, bottom: 0 }}>
            <defs>
              <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.2} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e2733" vertical={false} />
            <XAxis
              dataKey="ts"
              tickFormatter={fmtTime}
              tick={{ fontSize: 11, fill: "#64748b" }}
              axisLine={{ stroke: "#2a3441" }}
              tickLine={false}
              interval="preserveStartEnd"
              tickMargin={8}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#64748b", fontFamily: "var(--font-mono)" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `$${fmtPrice(v)}`}
              width={yWidth}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#3d4f63", strokeWidth: 1 }} />
            {hasNeg && <ReferenceLine y={0} stroke="#3d4f63" strokeWidth={1} strokeDasharray="4 4" />}
            <Line
              type="monotone" dataKey="da" name="DA"
              stroke="#64748b" strokeWidth={1.5} strokeDasharray="5 4"
              dot={false} connectNulls
              activeDot={{ r: 3, fill: "#94a3b8", strokeWidth: 0 }}
            />
            <Area
              type="monotone" dataKey="rt"
              fill={`url(#${gradId})`} stroke="none"
              dot={false} connectNulls={false} isAnimationActive={false}
            />
            <Line
              type="monotone" dataKey="rt" name="RT"
              stroke={color} strokeWidth={2}
              dot={false} connectNulls={false}
              activeDot={{ r: 4, fill: color, strokeWidth: 0 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
