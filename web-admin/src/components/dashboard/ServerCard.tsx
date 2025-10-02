import type { ReactNode } from "react";
import clsx from "clsx";
import { SignalHigh, Thermometer, Timer, Wifi } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import type { ServerCardData } from "@/types/dashboard";
import { countryCodeToFlag, countryCodeToFlagUrl } from "@/utils/flags";

interface ServerCardProps {
  server: ServerCardData;
  layout?: "wide" | "compact";
}
const BYTES_UNITS = ["B", "KB", "MB", "GB", "TB", "PB"];
const speedFormatter = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 1, minimumFractionDigits: 1 });
const integerFormatter = new Intl.NumberFormat("ru-RU");
const relativeTimeFormatter = new Intl.RelativeTimeFormat("ru-RU", { numeric: "auto" });
const TB_IN_BYTES = 1024 ** 4;


const STATUS_MAP: Record<ServerCardData["status"], { label: string; color: string }> = {
  online: { label: "В онлайне", color: "bg-success/15 text-success" },
  degraded: { label: "Нагрузка", color: "bg-warning/15 text-warning" },
  offline: { label: "Отключен", color: "bg-danger/15 text-danger" },
};

export function ServerCard({ server, layout = "compact" }: ServerCardProps) {
  const status = STATUS_MAP[server.status];
  const hasSpeedData = (server.downloadSpeedBps ?? 0) > 0 || (server.uploadSpeedBps ?? 0) > 0;

  const pingValue = formatPingValue(server.pingMs);
  const speedValue = hasSpeedData ? formatSpeedPair(server.downloadMbps, server.uploadMbps) : "нет данных";
  const trafficBytes =
    server.trafficBytes ?? server.realtimeTotalBytes ?? (server.trafficTb > 0 ? server.trafficTb * TB_IN_BYTES : 0);
  const trafficValue = formatBytesReadable(trafficBytes);
  const trafficHint = (() => {
    const downloadBytes = server.downloadBytes ?? 0;
    const uploadBytes = server.uploadBytes ?? 0;
    if (downloadBytes <= 0 && uploadBytes <= 0) {
      return undefined;
    }
    const down = downloadBytes > 0 ? formatBytesReadable(downloadBytes) : "0 B";
    const up = uploadBytes > 0 ? formatBytesReadable(uploadBytes) : "0 B";
    return `${down} ↓ / ${up} ↑`;
  })();
  const temperatureValue = formatTemperatureValue(server.temperatureC);
  const lastUpdatedLabel = formatUpdatedLabel(server.realtimeUpdatedAt);

  const uptimeDays = Math.floor(server.uptimeHours / 24);
  const uptimeHours = server.uptimeHours % 24;
  const uptimeValue = server.uptimeHours > 0 ? `${uptimeDays}д ${uptimeHours}ч` : "нет данных";
  const uptimeAddon =
    server.uptimePercent > 0 && (server.uptimeHours > 0 || lastUpdatedLabel)
      ? `${server.uptimePercent.toFixed(1)}%`
      : undefined;

  const providerLabel = /^[A-Za-z]{2}$/i.test(server.provider.trim())
    ? countryCodeToFlag(server.provider)
    : server.provider;

  const locationLabel = (() => {
    const match = server.location.match(/^(.*?)(?:,|\s)\s*([A-Za-z]{2})$/);
    if (match) {
      return `${match[1].trim()} ${countryCodeToFlag(match[2])}`;
    }
    return server.location;
  })();

  const isoCode = (server.countryCode || "").toUpperCase();

  const detailBody = (
    <div className={clsx("relative flex flex-col gap-5", layout === "wide" ? "xl:flex-row xl:gap-10" : undefined)}>
      <div className="grid flex-1 gap-4 sm:grid-cols-2">
        <Metric label="Пинг" value={pingValue} icon={<SignalHigh className="h-4 w-4 text-sky" />} />
        <Metric
          label="Скорость"
          value={speedValue}
          icon={<Wifi className="h-4 w-4 text-primary" />}
          hint={hasSpeedData ? "↓ / ↑" : undefined}
        />
        <Metric
          label="Трафик"
          value={trafficValue}
          icon={<Timer className="h-4 w-4 text-success" />}
          hint={trafficHint ?? "за 24 ч"}
        />
        <Metric label="Температура" value={temperatureValue} icon={<Thermometer className="h-4 w-4 text-danger" />} />
      </div>

      <div className="rounded-2xl border border-outline/40 bg-surfaceMuted/40 p-4">
        <p className="text-xs uppercase tracking-[0.32em] text-textMuted">Ресурсы</p>
        <dl className="mt-3 grid gap-3 text-sm text-textMuted">
          <Stat label="Пользователи" value={`${server.usersOnline}`} addon="онлайн" />
          <Progress label="CPU" value={server.cpuUsagePercent} tone={server.cpuUsagePercent > 65 ? "warning" : "success"} />
          <Progress label="RAM" value={server.ramUsagePercent} tone={server.ramUsagePercent > 70 ? "warning" : "success"} />
          <Stat label="Uptime" value={uptimeValue} addon={uptimeAddon} />
        </dl>
        {lastUpdatedLabel ? <p className="mt-4 text-xs text-textMuted">Обновлено {lastUpdatedLabel}</p> : null}
      </div>
    </div>
  );

  return (
    <article className={clsx(
      "card glow-border relative overflow-hidden rounded-3xl border border-outline/50 bg-surface/70 p-6",
      layout === "wide" ? "xl:col-span-2" : undefined,
    )}>
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-surfaceMuted/80 text-2xl">
            {isoCode ? (
              <img
                src={countryCodeToFlagUrl(isoCode, "svg")}
                alt={isoCode}
                className="h-full w-full object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                }}
              />
            ) : (
              <span role="img" aria-label={isoCode}>{countryCodeToFlag(server.countryCode)}</span>
            )}
            {isoCode ? (
              <span className="absolute bottom-1 right-1 rounded border border-outline/40 bg-background/80 px-1 py-0.5 text-[10px] font-semibold uppercase leading-none text-textMuted">
                {isoCode}
              </span>
            ) : null}
          </div>
          <div>
            <p className="text-lg font-semibold text-white">{server.name}</p>
            <p className="text-sm text-textMuted">{locationLabel}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className={clsx("rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide", status.color)}>{status.label}</span>
          <span className="text-xs text-textMuted">{providerLabel}</span>
        </div>
      </header>

      <div className="mt-5">{detailBody}</div>

      {layout === "wide" ? (
        <div className="mt-6 h-32 rounded-2xl border border-outline/40 bg-surfaceMuted/40 px-4 py-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={server.history}>
              <defs>
                <linearGradient id={`usage-${server.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4c6ef5" stopOpacity={0.45} />
                  <stop offset="100%" stopColor="#4c6ef5" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="value"
                stroke="#4c6ef5"
                strokeWidth={2}
                fill={`url(#usage-${server.id})`}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : null}
    </article>
  );
}


interface MetricProps {
  label: string;
  value: string;
  icon: ReactNode;
  hint?: string;
}

function Metric({ label, value, icon, hint }: MetricProps) {
  const isUnavailable = value === "нет данных";

  return (
    <div className="flex items-center justify-between rounded-2xl border border-outline/40 bg-surfaceMuted/40 px-4 py-3 text-sm">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-textMuted">{label}</p>
        <p className={clsx("mt-1 text-base font-semibold text-white", isUnavailable ? "text-textMuted" : undefined)}>{value}</p>
      </div>
      <div className="flex flex-col items-end gap-1 text-xs text-textMuted">
        <span className="rounded-xl bg-surface/60 p-2">{icon}</span>
        {hint ? <span>{hint}</span> : null}
      </div>
    </div>
  );
}

interface StatProps {
  label: string;
  value: string;
  addon?: string;
}

function Stat({ label, value, addon }: StatProps) {
  const isUnavailable = value === "нет данных";

  return (
    <div className="flex items-center justify-between">
      <span>{label}</span>
      <span className={clsx("font-semibold text-slate-100", isUnavailable ? "text-textMuted" : undefined)}>
        {value}
        {addon ? <span className="ml-2 text-xs text-textMuted">{addon}</span> : null}
      </span>
    </div>
  );
}

interface ProgressProps {
  label: string;
  value: number;
  tone?: "success" | "warning" | "danger";
}

const TONEMAP: Record<NonNullable<ProgressProps["tone"]>, string> = {
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
};

function Progress({ label, value, tone = "success" }: ProgressProps) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span>{label}</span>
        <span className="font-semibold text-slate-100">{Math.round(value)}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-surfaceMuted/70">
        <div className={clsx("h-full rounded-full", TONEMAP[tone])} style={{ width: `${Math.min(value, 100)}%` }} />
      </div>
    </div>
  );
}


function isPositiveNumber(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function formatBytesReadable(bytes?: number | null): string {
  if (!isPositiveNumber(bytes)) {
    return "нет данных";
  }
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < BYTES_UNITS.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  const decimals = value >= 10 ? 0 : 1;
  const formatted = decimals === 0 ? integerFormatter.format(Math.round(value)) : speedFormatter.format(value);
  return `${formatted} ${BYTES_UNITS[unitIndex]}`;
}

function formatSpeedPair(download: number, upload: number): string {
  const formatValue = (value: number) => {
    if (!Number.isFinite(value) || value < 0) {
      return speedFormatter.format(0);
    }
    if (value >= 100) {
      return integerFormatter.format(Math.round(value));
    }
    return speedFormatter.format(value);
  };
  return `${formatValue(download)} / ${formatValue(upload)} Mbps`;
}

function formatPingValue(ms: number | null | undefined): string {
  if (!isPositiveNumber(ms)) {
    return "нет данных";
  }
  return `${Math.round(ms)} мс`;
}

function formatTemperatureValue(value: number | null | undefined): string {
  if (!isPositiveNumber(value)) {
    return "нет данных";
  }
  return `${Math.round(value)}°C`;
}

function formatUpdatedLabel(timestamp?: string): string | null {
  if (!timestamp) {
    return null;
  }
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.round(diffMs / 60000);

  if (Math.abs(diffMinutes) < 1) {
    return diffMs >= 0 ? "менее минуты назад" : "через минуту";
  }
  if (Math.abs(diffMinutes) < 60) {
    return relativeTimeFormatter.format(-diffMinutes, "minute");
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 24) {
    return relativeTimeFormatter.format(-diffHours, "hour");
  }

  return date.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
