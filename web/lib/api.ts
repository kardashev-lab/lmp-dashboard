const API = process.env.KARDASHEV_API_URL ?? "https://data.kardashevlabs.org";

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

async function apiFetch<T>(path: string, revalidate = 300): Promise<T | null> {
  try {
    const res = await fetch(`${API}${path}`, { next: { revalidate } });
    if (!res.ok) return null;
    return res.json() as Promise<T>;
  } catch {
    return null;
  }
}

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
