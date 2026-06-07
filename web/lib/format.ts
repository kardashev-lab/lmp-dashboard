export function fmtPrice(lmp: number | null | undefined): string {
  if (lmp == null) return "—";
  const abs = Math.abs(lmp);
  if (abs >= 1000) return `${(lmp / 1000).toFixed(1)}k`;
  if (abs >= 100) return lmp.toFixed(1);
  return lmp.toFixed(2);
}

export function priceColor(lmp: number | null | undefined): string {
  if (lmp == null) return "rgba(255,255,255,0.25)";
  if (lmp < 0) return "#a855f7";
  if (lmp < 30) return "#34d399";
  if (lmp < 75) return "#86efac";
  if (lmp < 150) return "#fbbf24";
  if (lmp < 300) return "#f97316";
  return "#ef4444";
}

export function fmtTime(ts: string): string {
  return new Date(ts).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC",
  });
}

export function fmtTimestamp(ts: string): string {
  return new Date(ts).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC",
  }) + " UTC";
}
