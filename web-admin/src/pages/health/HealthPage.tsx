import { Activity, CheckCircle2, Info, Server } from "lucide-react";
import { useHealth } from "@/features/health/queries";

export function HealthPage() {
  const { data, isLoading, isError } = useHealth();
  const status = isLoading ? "loading" : isError ? "error" : data?.status || "unknown";

  return (
    <section className="space-y-6">
      <header className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surfaceMuted/80 text-primary">
          <Server className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.32em] text-textMuted/70">Система</p>
          <h1 className="text-xl font-semibold text-white">Состояние API</h1>
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi icon={<CheckCircle2 className="h-4 w-4 text-success" />} label="Статус" value={status === "ok" ? "OK" : status} />
        <Kpi icon={<Info className="h-4 w-4 text-sky" />} label="API версия" value={data?.api_version ?? "—"} />
        <Kpi icon={<Activity className="h-4 w-4 text-warning" />} label="Версия бота" value={data?.bot_version ?? "—"} />
        <Kpi icon={<Activity className="h-4 w-4 text-primary" />} label="Мониторинг" value={data?.features?.monitoring ? "вкл" : "выкл"} />
      </div>
    </section>
  );
}

function Kpi({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-outline/40 bg-surfaceMuted/40 p-3">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface/60">{icon}</span>
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-[0.28em] text-textMuted/70">{label}</p>
        <p className="truncate text-sm font-semibold text-white">{value}</p>
      </div>
    </div>
  );
}


