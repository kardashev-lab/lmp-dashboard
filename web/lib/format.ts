/** PJM / industry-standard LMP price buckets (USD/MWh) */
export const LMP_BUCKETS = [
  { label: "< $10",    min: -Infinity, max: 10,   bg: "#1b4332", text: "#95d5b2" },
  { label: "$10–20",  min: 10,        max: 20,   bg: "#2d6a4f", text: "#b7e4c7" },
  { label: "$20–40",  min: 20,        max: 40,   bg: "#40916c", text: "#d8f3dc" },
  { label: "$40–70",  min: 40,        max: 70,   bg: "#b08928", text: "#fff3cd" },
  { label: "$70–100", min: 70,        max: 100,  bg: "#e07b39", text: "#fff" },
  { label: "$100–200",min: 100,       max: 200,  bg: "#c1121f", text: "#fff" },
  { label: "$200–500",min: 200,       max: 500,  bg: "#7b2d8e", text: "#f3e8ff" },
  { label: "> $500",  min: 500,       max: Infinity, bg: "#3c096c", text: "#e0aaff" },
] as const;

export function lmpBucket(lmp: number | null | undefined) {
  if (lmp == null) return { label: "—", bg: "#1e293b", text: "#94a3b8" };
  if (lmp < 0) return { label: "Negative", bg: "#4c1d95", text: "#ddd6fe" };
  const b = LMP_BUCKETS.find(b => lmp >= b.min && lmp < b.max)!;
  return { label: b.label, bg: b.bg, text: b.text };
}

export function fmtPrice(lmp: number | null | undefined): string {
  if (lmp == null) return "—";
  const abs = Math.abs(lmp);
  if (abs >= 1000) return `${(lmp / 1000).toFixed(1)}k`;
  if (abs >= 100) return lmp.toFixed(1);
  return lmp.toFixed(2);
}

export function priceColor(lmp: number | null | undefined): string {
  return lmpBucket(lmp).text;
}

export function priceBg(lmp: number | null | undefined): string {
  return lmpBucket(lmp).bg;
}

/** DART spread: positive = RT above DA (tighter supply / congestion) */
export function spreadColor(spread: number | null | undefined): string {
  if (spread == null) return "#94a3b8";
  if (spread > 5) return "#f87171";
  if (spread > 0) return "#fb923c";
  if (spread < -5) return "#4ade80";
  if (spread < 0) return "#86efac";
  return "#94a3b8";
}

export function fmtChange(delta: number | null | undefined): string {
  if (delta == null) return "—";
  const sign = delta > 0 ? "+" : "";
  return `${sign}$${fmtPrice(delta)}`;
}

export function fmtTime(ts: string): string {
  return new Date(ts).toLocaleTimeString("en-US", {
    hour: "2-digit", minute: "2-digit",
    hour12: false, timeZone: "UTC",
  });
}

export function fmtTimestamp(ts: string): string {
  return new Date(ts).toLocaleString("en-US", {
    month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
    hour12: false, timeZone: "UTC",
  }) + " UTC";
}
