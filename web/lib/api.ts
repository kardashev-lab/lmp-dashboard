const API = (process.env.KARDASHEV_API_URL ?? "https://data.kardashevlabs.org").replace(/\/$/, "");

// ── LMP ─────────────────────────────────────────────────────────────

export type LMPPoint = {
  ts: string;
  iso: string;
  node_id: string;
  node_name: string | null;
  market: string;
  lmp: number | null;
  energy: number | null;
  congestion: number | null;
  loss: number | null;
};

export type Hub = {
  node_id: string;
  node_name: string | null;
  market: string;
};

export type HubData = {
  node_id: string;
  node_name: string;
  rtPoints: LMPPoint[];
  daPoints: LMPPoint[];
};

// ── Fuel mix ─────────────────────────────────────────────────────────

export type FuelMixPoint = {
  ts: string;
  iso: string;
  fuel_type: string;
  mw: number | null;
};

// ── Load ─────────────────────────────────────────────────────────────

export type LoadPoint = {
  ts: string;
  iso: string;
  zone: string;
  mw_actual: number | null;
  mw_forecast: number | null;
};

// ── Natural gas ───────────────────────────────────────────────────────

export type NatGasPrice = {
  ts: string;
  hub: string;
  price_usd: number | null;
};

export type GasStoragePoint = {
  ts: string;
  region: string;
  bcf: number | null;
};

// ── Weather ───────────────────────────────────────────────────────────

export type TempPoint = {
  ts: string;
  iso: string;
  city: string;
  temp_f: number | null;
  humidity_pct: number | null;
  wind_mph: number | null;
};

// ── Curtailment ───────────────────────────────────────────────────────

export type CurtailmentDay = {
  date: string;
  iso: string;
  solar_mwh: number;
  wind_mwh: number;
  total_mwh: number;
};

export type CurtailmentSummary = {
  iso: string;
  latest_date: string | null;
  solar_30d_mwh: number | null;
  wind_30d_mwh: number | null;
  total_30d_mwh: number | null;
};

// ── Generation ────────────────────────────────────────────────────────

export type BatteryPoint = {
  ts: string;
  iso: string;
  mw_charging: number | null;
  mw_discharging: number | null;
  mwh_state: number | null;
};

export type ReserveMarginPoint = {
  ts: string;
  iso: string;
  required_pct: number | null;
  actual_pct: number | null;
  installed_mw: number | null;
  peak_mw: number | null;
};

// ── Core fetch ────────────────────────────────────────────────────────

async function apiFetch<T>(path: string, revalidate = 300): Promise<T | null> {
  try {
    const res = await fetch(`${API}${path}`, { next: { revalidate } });
    if (!res.ok) return null;
    return res.json() as Promise<T>;
  } catch {
    return null;
  }
}

// ── LMP ──────────────────────────────────────────────────────────────

export async function fetchLMPSeries(
  iso: string,
  node_id: string,
  market: "RT" | "DA",
  limit = 300,
): Promise<LMPPoint[]> {
  const path = `/lmp?iso=${iso}&node_id=${encodeURIComponent(node_id)}&market=${market}&limit=${limit}`;
  const data = await apiFetch<LMPPoint[]>(path);
  if (!data) return [];
  return [...data].reverse();
}

export async function fetchHubs(iso: string): Promise<Hub[]> {
  const data = await apiFetch<Hub[]>(`/lmp/hubs?iso=${iso}`, 3600);
  return data ?? [];
}

// ── Fuel mix ─────────────────────────────────────────────────────────

export async function fetchFuelMixLatest(iso: string): Promise<FuelMixPoint[]> {
  const data = await apiFetch<FuelMixPoint[]>(`/fuel-mix/latest?iso=${iso}`, 300);
  return data ?? [];
}

// ── Load ─────────────────────────────────────────────────────────────

export async function fetchLoad(iso: string, hours = 2): Promise<LoadPoint[]> {
  const data = await apiFetch<LoadPoint[]>(`/load?iso=${iso}&hours=${hours}&limit=500`, 300);
  return data ?? [];
}

/** Sum all zones at the latest timestamp → system total MW */
export function latestSystemLoadMW(points: LoadPoint[]): number | null {
  if (!points.length) return null;
  const maxTs = points.reduce((a, b) => (a.ts > b.ts ? a : b)).ts;
  const vals = points
    .filter(p => p.ts === maxTs)
    .map(p => p.mw_actual)
    .filter((v): v is number => v != null);
  return vals.length ? vals.reduce((a, b) => a + b, 0) : null;
}

// ── Natural gas ───────────────────────────────────────────────────────

export async function fetchNatGasLatest(): Promise<NatGasPrice[]> {
  const data = await apiFetch<NatGasPrice[]>("/natural-gas/latest", 3600);
  return data ?? [];
}

export async function fetchNatGas(days = 30): Promise<NatGasPrice[]> {
  const data = await apiFetch<NatGasPrice[]>(`/natural-gas?days=${days}&limit=5000`, 3600);
  return (data ?? []).reverse();
}

export async function fetchGasStorage(weeks = 8): Promise<GasStoragePoint[]> {
  const data = await apiFetch<GasStoragePoint[]>(`/natural-gas/storage?weeks=${weeks}`, 3600);
  return data ?? [];
}

// ── Weather ───────────────────────────────────────────────────────────

export async function fetchWeatherLatest(): Promise<TempPoint[]> {
  const data = await apiFetch<TempPoint[]>("/weather/latest", 1800);
  return data ?? [];
}

// ── Curtailment ───────────────────────────────────────────────────────

export async function fetchCurtailmentSummary(): Promise<CurtailmentSummary[]> {
  const data = await apiFetch<CurtailmentSummary[]>("/curtailment/summary", 3600);
  return data ?? [];
}

export async function fetchCurtailment(iso: string, days = 14): Promise<CurtailmentDay[]> {
  const data = await apiFetch<CurtailmentDay[]>(`/curtailment?iso=${iso}&days=${days}`, 3600);
  return data ?? [];
}

// ── Generation ────────────────────────────────────────────────────────

export async function fetchBattery(iso = "CAISO", hours = 2): Promise<BatteryPoint[]> {
  const data = await apiFetch<BatteryPoint[]>(`/generation/battery?iso=${iso}&hours=${hours}&limit=100`, 300);
  return (data ?? []).reverse();
}

export async function fetchReserveMargins(): Promise<ReserveMarginPoint[]> {
  const data = await apiFetch<ReserveMarginPoint[]>("/generation/reserve-margins", 3600);
  return data ?? [];
}
