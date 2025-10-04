import clsx from "clsx";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { SalesChartCard } from "@/components/dashboard/SalesChartCard";
import type { RevenuePoint } from "@/types/dashboard";

interface OverviewMetric {
  id: string;
  title: string;
  value: string;
  caption?: string;
  icon: LucideIcon;
  delta?: number;
  deltaLabel?: string;
  accent?: "purple" | "blue" | "green" | "pink";
}

interface OverviewPanelProps {
  metrics: OverviewMetric[];
  chartPoints: RevenuePoint[];
}

const accentMap: Record<NonNullable<OverviewMetric["accent"]>, string> = {
  purple: "from-primary/80 via-primary/60 to-sky/40",
  blue: "from-sky/70 via-sky/60 to-primary/40",
  green: "from-success/70 via-success/60 to-primary/30",
  pink: "from-danger/70 via-danger/60 to-primary/30",
};

export function OverviewPanel({ metrics, chartPoints }: OverviewPanelProps) {
  return (
    <section className="card glow-border relative overflow-hidden rounded-3xl border border-outline/50 bg-surface/70 p-8">
      <div className="absolute inset-px rounded-[26px] bg-gradient-to-br from-white/5 via-white/0 to-transparent opacity-40" />
      <header className="relative flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.32em] text-textMuted/70">панель управления</p>
          <h1 className="mt-2 text-3xl font-semibold text-white">Добро пожаловать в систему управления VPN ботом</h1>
          <p className="mt-2 max-w-2xl text-sm text-textMuted">
            Следите за ключевыми метриками и синхронизируйте данные RemnaWave и бота в реальном времени.
          </p>
        </div>
      </header>

      <div className="relative mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <MetricTile key={metric.id} metric={metric} />
        ))}
      </div>

      <div className="relative mt-8">
        <SalesChartCard
          title="График продаж"
          subtitle="Динамика подписок за последние 30 дней"
          points={chartPoints}
          variant="embedded"
        />
      </div>
    </section>
  );
}

function MetricTile({ metric }: { metric: OverviewMetric }) {
  const { title, value, caption, icon: Icon, delta, deltaLabel, accent = "purple" } = metric;
  const deltaPositive = delta !== undefined && delta >= 0;
  const showDelta = delta !== undefined && Number.isFinite(delta);

  return (
    <article className="relative overflow-hidden rounded-2xl border border-outline/40 bg-surfaceMuted/50 p-5">
      <div className="absolute inset-0 bg-gradient-to-br from-white/4 via-transparent to-transparent opacity-40" />
      <div className="relative flex items-start justify-between">
        <p className="text-xs uppercase tracking-[0.32em] text-textMuted/70">{title}</p>
        <span className={clsx("flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br", accentMap[accent])}>
          <Icon className="h-5 w-5 text-white" />
        </span>
      </div>
      <p className="relative mt-4 text-3xl font-semibold text-white">{value}</p>
      {caption ? <p className="relative mt-2 text-xs text-textMuted">{caption}</p> : null}
      {showDelta ? (
        <div className="relative mt-4 inline-flex items-center gap-2 rounded-full bg-surface/70 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
          {deltaPositive ? (
            <ArrowUpRight className="h-4 w-4 text-success" />
          ) : (
            <ArrowDownRight className="h-4 w-4 text-danger" />
          )}
          <span className={deltaPositive ? "text-success" : "text-danger"}>{Math.abs(delta!).toFixed(1)}%</span>
          {deltaLabel ? <span className="text-textMuted">{deltaLabel}</span> : null}
        </div>
      ) : null}
    </article>
  );
}


