"use client";

import { useState } from "react";
import type { HubData, FuelMixPoint, BatteryPoint, ReserveMarginPoint } from "@/lib/api";
import ISOSection from "./ISOSection";

type IsoConfig = {
  iso: string;
  label: string;
  color: string;
  hubs: HubData[];
  fuelMix: FuelMixPoint[];
  currentLoad: number | null;
  battery?: BatteryPoint[];
  reserveMargin: ReserveMarginPoint | null;
};

export default function DashboardShell({ isos }: { isos: IsoConfig[] }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const active = isos[activeIdx];

  return (
    <section className="iso-explorer">
      <div className="iso-tabs" role="tablist">
        {isos.map((iso, i) => (
          <button
            key={iso.iso}
            role="tab"
            aria-selected={i === activeIdx}
            className={`iso-tab${i === activeIdx ? " active" : ""}`}
            onClick={() => setActiveIdx(i)}
          >
            <span className="iso-tab-dot" style={{ background: iso.color }} />
            {iso.label}
          </button>
        ))}
      </div>

      <ISOSection
        key={active.iso}
        iso={active.iso}
        label={active.label}
        color={active.color}
        hubs={active.hubs}
        fuelMix={active.fuelMix}
        currentLoad={active.currentLoad}
        battery={active.battery}
        reserveMargin={active.reserveMargin}
      />
    </section>
  );
}
