"use client";

import { useEffect, useMemo, useState, type MouseEvent } from "react";
import {
  AreaSeries,
  Axis,
  ChartFrame,
  ChartTooltip,
  LineSeries,
  closestIndex,
  clientToViewBoxX,
  createTimeLinearScales,
  padDomain,
  toMs,
} from "kardashev-charts";
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

type Props = {
  rtPoints: LMPPoint[];
  daPoints: LMPPoint[];
  color: string;
  nodeName?: string;
};

function useChartInsets() {
  const [insets, setInsets] = useState({ left: 4, yWidth: 56 });
  useEffect(() => {
    const update = () => {
      setInsets(window.innerWidth < 768 ? { left: 12, yWidth: 72 } : { left: 4, yWidth: 56 });
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return insets;
}

export default function LMPChart({ rtPoints, daPoints, color, nodeName }: Props) {
  const data = buildChartData(rtPoints, daPoints);
  const { left, yWidth } = useChartInsets();

  const latestRt = [...rtPoints].reverse().find((p) => p.lmp != null)?.lmp ?? null;
  const chartLabel = [
    nodeName ? `${nodeName} real-time and day-ahead price chart.` : "Real-time and day-ahead price chart.",
    latestRt != null ? `Latest real-time price $${fmtPrice(latestRt)} per megawatt-hour.` : null,
  ]
    .filter(Boolean)
    .join(" ");

  if (!data.length) {
    return (
      <div className="chart-container chart-empty">
        Awaiting data. Next 5-minute interval.
      </div>
    );
  }

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
      <div className="chart-container" role="img" aria-label={chartLabel}>
        <ChartFrame height={280} theme="substation" minWidth={60}>
          {(size) => (
            <LMPInner
              data={data}
              color={color}
              width={size.width}
              height={size.height}
              left={left}
              yWidth={yWidth}
            />
          )}
        </ChartFrame>
      </div>
    </div>
  );
}

function LMPInner({
  data,
  color,
  width,
  height,
  left,
  yWidth,
}: {
  data: ChartPoint[];
  color: string;
  width: number;
  height: number;
  left: number;
  yWidth: number;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const padding = { top: 8, right: 12, bottom: 24, left: Math.max(left, yWidth) };
  const gradId = `grad-${color.replace("#", "")}`;

  const { scales, xs, rtPts, daPts, yTicks, xTicks, hasNeg } = useMemo(() => {
    const times = data.map((d) => toMs(d.ts));
    const minT = Math.min(...times);
    const maxT = Math.max(...times);
    const allValues = data.flatMap((d) => [d.rt, d.da]).filter((v): v is number => v != null);
    const hasNeg = allValues.some((v) => v < 0);
    const [lo, hi] = padDomain(Math.min(...allValues, 0), Math.max(...allValues, 0), 0.08);
    const scales = createTimeLinearScales({
      width,
      height,
      xDomain: [minT, maxT],
      yDomain: [lo, hi],
      padding,
    });
    const xs = data.map((d) => scales.x(new Date(d.ts)));
    const rtPts = data.map((d) => ({
      x: scales.x(new Date(d.ts)),
      y: d.rt != null ? scales.y(d.rt) : null,
    }));
    const daPts = data.map((d) => ({
      x: scales.x(new Date(d.ts)),
      y: d.da != null ? scales.y(d.da) : null,
    }));
    const tickCount = 5;
    const xTicks = Array.from({ length: tickCount }, (_, i) => {
      const t = minT + ((maxT - minT) * i) / (tickCount - 1 || 1);
      return { value: new Date(t), label: fmtTime(new Date(t).toISOString()) };
    });
    const yTicks = [lo, (lo + hi) / 2, hi].map((v) => ({
      value: v,
      label: `$${fmtPrice(v)}`,
    }));
    return { scales, xs, rtPts, daPts, yTicks, xTicks, hasNeg };
  }, [data, width, height, left, yWidth]);

  const onMove = (e: MouseEvent<SVGSVGElement>) => {
    setHover(closestIndex(xs, clientToViewBoxX(e.currentTarget, e.clientX, width)));
  };

  const h = hover != null ? data[hover] : null;
  const hx = hover != null ? xs[hover] : null;

  return (
    <div style={{ position: "relative", width, height }}>
      <svg width={width} height={height} onMouseMove={onMove} onMouseLeave={() => setHover(null)}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.2} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Axis
          x={scales.x}
          y={scales.y}
          width={width}
          height={height}
          padding={padding}
          theme="substation"
          xTicks={xTicks}
          yTicks={yTicks}
          showGrid
        />
        {hasNeg && (
          <line
            x1={padding.left}
            x2={width - padding.right}
            y1={scales.y(0)}
            y2={scales.y(0)}
            stroke="#3d4f63"
            strokeDasharray="4 4"
          />
        )}
        <LineSeries
          points={daPts}
          stroke="#64748b"
          strokeWidth={1.5}
          strokeDasharray="5 4"
          curve="monotone"
        />
        <AreaSeries
          points={rtPts}
          y0={scales.y(0)}
          fill={`url(#${gradId})`}
          fillOpacity={1}
          curve="monotone"
        />
        <LineSeries points={rtPts} stroke={color} strokeWidth={2} curve="monotone" />
        {hx != null && (
          <line
            x1={hx}
            x2={hx}
            y1={padding.top}
            y2={height - padding.bottom}
            stroke="#3d4f63"
          />
        )}
      </svg>
      {h && hx != null && (
        <div style={{ position: "absolute", left: Math.min(hx + 8, width - 160), top: 8 }}>
          <ChartTooltip
            theme="substation"
            style={{ background: "#1c2430", border: "1px solid #2a3441" }}
          >
            <p style={{ color: "#64748b", marginBottom: 8, fontSize: 11 }}>
              {fmtTime(h.ts)} UTC
            </p>
            {h.rt != null && (
              <div style={{ display: "flex", gap: 10, marginBottom: 4 }}>
                <span style={{ width: 8, height: 3, background: color, marginTop: 6 }} />
                <span style={{ color: "#94a3b8", minWidth: 24 }}>RT</span>
                <span style={{ color: "#e8edf4", fontWeight: 600 }}>${fmtPrice(h.rt)}</span>
              </div>
            )}
            {h.da != null && (
              <div style={{ display: "flex", gap: 10 }}>
                <span style={{ width: 8, height: 0, borderTop: "2px dashed #64748b", marginTop: 7 }} />
                <span style={{ color: "#94a3b8", minWidth: 24 }}>DA</span>
                <span style={{ color: "#e8edf4", fontWeight: 600 }}>${fmtPrice(h.da)}</span>
              </div>
            )}
          </ChartTooltip>
        </div>
      )}
    </div>
  );
}
