import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { clsx } from "clsx";

interface MetricCardProps {
  title: string;
  value: string;
  caption?: string;
  delta?: number;
  deltaLabel?: string;
  icon: LucideIcon;
  accent?: "purple" | "blue" | "green" | "pink";
}

const accentMap: Record<NonNullable<MetricCardProps["accent"]>, string> = {
  purple: "from-primary/80 via-primary/60 to-sky/40",
  blue: "from-sky/70 via-sky/60 to-primary/40",
  green: "from-success/70 via-success/60 to-primary/30",
  pink: "from-danger/70 via-danger/60 to-primary/30",
};

export function MetricCard({ title, value, caption, delta, deltaLabel, icon: Icon, accent = "purple" }: MetricCardProps) {
  const deltaPositive = delta !== undefined && delta >= 0;
  const showDelta = delta !== undefined;

  return (
    <article className="card glow-border relative overflow-hidden rounded-2xl border border-outline/50 bg-surface/70 p-6">
      <div className="absolute inset-px rounded-[20px] bg-gradient-to-br from-white/4 via-white/0 to-white/0 opacity-40" />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.32em] text-textMuted/70">{title}</p>
          <p className="mt-3 text-3xl font-semibold text-white">{value}</p>
          {caption ? <p className="mt-2 text-xs text-textMuted">{caption}</p> : null}
        </div>
        <div className={clsx("flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br", accentMap[accent])}>
          <Icon className="h-5 w-5 text-white" />
        </div>
      </div>
      {showDelta ? (
        <div className="relative mt-4 inline-flex items-center gap-2 rounded-full bg-surfaceMuted/80 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
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


