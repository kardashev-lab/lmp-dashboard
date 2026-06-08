import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const API = process.env.KARDASHEV_API_URL ?? "https://data.kardashevlabs.org";
  const url = `${API}/lmp/hubs?iso=NYISO`;

  let result: Record<string, unknown>;
  try {
    const start = Date.now();
    const res = await fetch(url, { cache: "no-store" });
    const ms = Date.now() - start;
    const body = await res.text();
    result = {
      ok: res.status,
      ms,
      url,
      preview: body.slice(0, 200),
      api_env: process.env.KARDASHEV_API_URL ?? "(unset — using default)",
    };
  } catch (e: unknown) {
    result = {
      error: e instanceof Error ? e.message : String(e),
      url,
      api_env: process.env.KARDASHEV_API_URL ?? "(unset — using default)",
    };
  }

  return NextResponse.json(result);
}
