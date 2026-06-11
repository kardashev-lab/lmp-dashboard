import { NextRequest, NextResponse } from "next/server";
import { fetchLMPSeries } from "@/lib/api";

/**
 * Proxies LMP series fetches for hubs that weren't loaded during SSR.
 * Keeps KARDASHEV_API_URL server-side and benefits from Next's fetch cache.
 */
export async function GET(req: NextRequest) {
  const iso = req.nextUrl.searchParams.get("iso");
  const nodeId = req.nextUrl.searchParams.get("node_id");
  if (!iso || !nodeId) {
    return NextResponse.json({ error: "iso and node_id are required" }, { status: 400 });
  }
  const [rtPoints, daPoints] = await Promise.all([
    fetchLMPSeries(iso, nodeId, "RT", 300),
    fetchLMPSeries(iso, nodeId, "DA", 48),
  ]);
  return NextResponse.json(
    { rtPoints, daPoints },
    { headers: { "Cache-Control": "public, max-age=300" } },
  );
}
