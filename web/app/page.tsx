export const dynamic = "force-dynamic";

import {
  fetchHubs, fetchLMPSeries,
  fetchFuelMixLatest, fetchLoad, latestSystemLoadMW,
  fetchNatGasLatest, fetchGasStorage,
  fetchWeatherLatest, fetchCurtailmentSummary,
  fetchReserveMargins, fetchBattery,
  type Hub, type HubData,
} from "@/lib/api";
import OverviewCards from "@/components/OverviewCards";
import PriceLegend from "@/components/PriceLegend";
import DashboardShell from "@/components/DashboardShell";
import LiveClock from "@/components/LiveClock";
import MarketSignals from "@/components/MarketSignals";

const ISO_META = [
  { iso: "NYISO", label: "NYISO", region: "New York",               color: "#a78bfa" },
  { iso: "PJM",   label: "PJM",   region: "Mid-Atlantic",           color: "#60a5fa" },
  { iso: "CAISO", label: "CAISO", region: "California",             color: "#f87171" },
  { iso: "SPP",   label: "SPP",   region: "Central US",             color: "#4ade80" },
];

async function buildHubData(iso: string, hubs: Hub[]): Promise<HubData[]> {
  const seen = new Set<string>();
  let unique: Hub[] = [];
  for (const h of hubs) {
    if (!seen.has(h.node_id)) { seen.add(h.node_id); unique.push(h); }
  }
  if (iso === "SPP") {
    const hubNodes = unique.filter(h => /hub/i.test(h.node_id));
    if (hubNodes.length > 0) unique = hubNodes;
  }
  const limited = unique.slice(0, 6);
  return Promise.all(
    limited.map(async (hub) => {
      const [rtPoints, daPoints] = await Promise.all([
        fetchLMPSeries(iso, hub.node_id, "RT", 300),
        fetchLMPSeries(iso, hub.node_id, "DA", 48),
      ]);
      return { node_id: hub.node_id, node_name: hub.node_name ?? hub.node_id, rtPoints, daPoints };
    })
  );
}

export default async function HomePage() {
  const [allHubs, allFuelMix, allLoad, natGasLatest, gasStorage, weatherLatest, curtailmentSummary, reserveMargins, caIsoBattery] =
    await Promise.all([
      Promise.all(ISO_META.map(({ iso }) => fetchHubs(iso))),
      Promise.all(ISO_META.map(({ iso }) => fetchFuelMixLatest(iso))),
      Promise.all(ISO_META.map(({ iso }) => fetchLoad(iso, 2))),
      fetchNatGasLatest(),
      fetchGasStorage(8),
      fetchWeatherLatest(),
      fetchCurtailmentSummary(),
      fetchReserveMargins(),
      fetchBattery("CAISO", 2),
    ]);

  const allData = await Promise.all(ISO_META.map(({ iso }, i) => buildHubData(iso, allHubs[i])));

  const overviewStats = ISO_META.map(({ iso, label, region, color }, i) => {
    const hubs = allData[i];
    const firstHub = hubs[0];
    const latestRT = firstHub?.rtPoints[firstHub.rtPoints.length - 1] ?? null;
    const latestDA = firstHub?.daPoints[firstHub.daPoints.length - 1] ?? null;
    const rt = latestRT?.lmp ?? null;
    const da = latestDA?.lmp ?? null;
    const spread = rt != null && da != null ? rt - da : null;
    const spreadPct = spread != null && da != null && da !== 0 ? spread / da * 100 : null;
    const firstName = firstHub?.node_name ?? "";
    const rtPrices = (firstHub?.rtPoints ?? []).map(p => p.lmp).filter((v): v is number => v != null);
    const high24 = rtPrices.length ? Math.max(...rtPrices) : null;
    const low24  = rtPrices.length ? Math.min(...rtPrices) : null;
    const load = latestSystemLoadMW(allLoad[i]);
    return { iso, label, region, color, rt, da, spread, spreadPct, firstName, high24, low24, load };
  });

  const isoConfigs = ISO_META.map(({ iso, label, color }, i) => ({
    iso,
    label,
    color,
    hubs: allData[i],
    fuelMix: allFuelMix[i],
    currentLoad: latestSystemLoadMW(allLoad[i]),
    battery: iso === "CAISO" ? caIsoBattery : undefined,
    reserveMargin: reserveMargins.find(r => r.iso === iso) ?? null,
  }));

  return (
    <div className="dashboard">
      <header className="dash-header">
        <div className="dash-header-left">
          <a href="https://www.kardashevlabs.org" className="dash-brand">Kardashev Labs</a>
          <h1 className="dash-title">LMP Dashboard</h1>
          <p className="dash-subtitle">
            Real-time locational marginal prices · NYISO, PJM, CAISO, SPP
          </p>
        </div>
        <div className="dash-header-right">
          <span className="dash-clock"><LiveClock /></span>
          <span className="dash-live">
            <span className="dash-live-dot" />
            Live · 5 min
          </span>
        </div>
      </header>

      <div className="section-head">
        <span className="section-title">Market overview</span>
        <span className="section-desc">Primary hub RT LMP per ISO</span>
      </div>
      <OverviewCards stats={overviewStats} />
      <PriceLegend />

      <div className="section-head">
        <span className="section-title">Market context</span>
        <span className="section-desc">Fundamentals affecting wholesale prices</span>
      </div>
      <MarketSignals
        natGas={natGasLatest}
        gasStorage={gasStorage}
        weather={weatherLatest}
        curtailment={curtailmentSummary}
        reserveMargins={reserveMargins}
      />

      <div className="section-head">
        <span className="section-title">ISO detail</span>
        <span className="section-desc">RT &amp; day-ahead series by pricing node</span>
      </div>
      <DashboardShell isos={isoConfigs} />
    </div>
  );
}
