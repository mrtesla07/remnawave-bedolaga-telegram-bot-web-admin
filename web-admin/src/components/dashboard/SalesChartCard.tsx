import clsx from "clsx";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import type { RevenuePoint } from "@/types/dashboard";

interface SalesChartCardProps {
  title: string;
  subtitle?: string;
  points: RevenuePoint[];
  variant?: "standalone" | "embedded";
  hideHeader?: boolean;
  className?: string;
}

function safeFormatDate(input: unknown, fmt: string, fallback = "") {
  if (input === undefined || input === null) return fallback;
  try {
    const date = input instanceof Date ? input : new Date(input as any);
    if (Number.isNaN(date.getTime())) return fallback;
    return format(date, fmt, { locale: ru });
  } catch {
    return fallback;
  }
}

export function SalesChartCard({
  title,
  subtitle,
  points,
  variant = "standalone",
  hideHeader = false,
  className,
}: SalesChartCardProps) {
  const containerClass = clsx(
    variant === "standalone"
      ? "card glow-border relative flex flex-col overflow-hidden rounded-3xl border border-outline/50 bg-surface/70"
      : "relative flex flex-col overflow-hidden rounded-3xl border border-outline/40 bg-surfaceMuted/40",
    className,
  );

  return (
    <section className={containerClass}>
      {!hideHeader ? (
        <header className="relative flex items-center justify-between px-6 pt-6">
          <div>
            <h2 className="text-lg font-semibold text-white">{title}</h2>
            {subtitle ? <p className="text-sm text-textMuted">{subtitle}</p> : null}
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-outline/40 bg-surfaceMuted/80 px-3 py-1 text-xs text-textMuted">
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            последние 30 дней
          </div>
        </header>
      ) : null}
      <div className="relative flex-1 px-2 pb-4">
        <ResponsiveContainer width="100%" height={variant === "standalone" ? 260 : 220}>
          <AreaChart data={points} margin={{ top: 20, right: 24, left: 12, bottom: 10 }}>
            <defs>
              <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6e59f5" stopOpacity={0.9} />
                <stop offset="50%" stopColor="#6e59f5" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#6e59f5" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              stroke="#5b6280"
              tickFormatter={(value) => safeFormatDate(value, "d MMM")}
            />
            <Tooltip
              cursor={{ stroke: "rgba(78, 70, 229, 0.3)", strokeWidth: 2 }}
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                const point = payload[0];
                return (
                  <div className="rounded-xl border border-outline/60 bg-background/95 px-4 py-3 text-sm shadow-card">
                    <p className="text-xs uppercase tracking-widest text-textMuted">
                      {safeFormatDate(label, "d MMMM yyyy", "—")}
                    </p>
                    <p className="mt-2 text-lg font-semibold text-white">
                      {new Intl.NumberFormat("ru-RU").format(Number(point.value))} ₽
                    </p>
                  </div>
                );
              }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#8a7df9"
              strokeWidth={3}
              fill="url(#salesGradient)"
              dot={false}
              activeDot={{ r: 5, strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}


