import { useState } from "react";
import RemnaOverviewPage from "./RemnaOverviewPage";
import RemnaNodesPage from "./RemnaNodesPage";
import RemnaInboundsPage from "./RemnaInboundsPage";
import RemnaSquadsPage from "./RemnaSquadsPage";
import RemnaSyncPage from "./RemnaSyncPage";

const TABS = [
  { key: "overview", label: "Обзор", Component: RemnaOverviewPage },
  { key: "nodes", label: "Ноды", Component: RemnaNodesPage },
  { key: "inbounds", label: "Inbounds", Component: RemnaInboundsPage },
  { key: "squads", label: "Сквады", Component: RemnaSquadsPage },
  { key: "sync", label: "Синхронизация", Component: RemnaSyncPage },
];

export default function RemnaWavePage() {
  const [active, setActive] = useState("overview");
  const Active = TABS.find((t) => t.key === active)?.Component || RemnaOverviewPage;

  return (
    <div className="space-y-6">
      <div className="p-4">
        <div className="flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button
              key={t.key}
              className={"rounded-full px-4 py-2 text-sm font-medium transition " + (active === t.key ? "bg-primary/90 text-white" : "bg-surfaceMuted/60 text-textMuted hover:bg-surfaceMuted/80")}
              onClick={() => setActive(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <Active />
    </div>
  );
}


