import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Activity, Clock3, Cpu, Gauge, HardDrive, Server, Users, Wifi } from "lucide-react";
import clsx from "clsx";
import type { RemnawaveSystemStats } from "@/types/dashboard";

interface SystemStatsCardProps {
  stats: RemnawaveSystemStats | null;
  isLoading?: boolean;
  nodesOnlineOverride?: number;
}

const numberFormatter = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 1, minimumFractionDigits: 1 });
const percentFormatter = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 1, minimumFractionDigits: 1 });
const relativeTimeFormatter = new Intl.RelativeTimeFormat("ru-RU", { numeric: "auto" });
const BYTES_IN_GB = 1024 ** 3;

export function SystemStatsCard({ stats, isLoading = false, nodesOnlineOverride }: SystemStatsCardProps) {
  if (isLoading && !stats) {
    return (
      <section className="card glow-border overflow-hidden rounded-3xl border border-outline/50 bg-surface/70 p-6">
        <header className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surfaceMuted/80 text-primary">
            <Server className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="text-xs uppercase tracking-[0.32em] text-textMuted/70">RemnaWave</p>
            <h2 className="text-lg font-semibold text-white">Детальная статистика</h2>
          </div>
        </header>
        <div className="mt-6 space-y-3">
          <SkeletonLine />
          <SkeletonLine />
          <SkeletonLine />
          <SkeletonLine />
        </div>
      </section>
    );
  }

  if (!stats) {
    return (
      <section className="card glow-border overflow-hidden rounded-3xl border border-outline/50 bg-surface/70 p-6">
        <header className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surfaceMuted/80 text-primary">
            <Server className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="text-xs uppercase tracking-[0.32em] text-textMuted/70">RemnaWave</p>
            <h2 className="text-lg font-semibold text-white">Детальная статистика</h2>
          </div>
        </header>
        <p className="mt-4 text-sm text-textMuted">Панель RemnaWave недоступна. Попробуйте обновить позже.</p>
      </section>
    );
  }

  const cpuValue = formatCpu(stats.server.cpuCores, stats.server.cpuPhysicalCores);
  const memory = formatMemory(
    stats.server.memoryUsedBytes,
    stats.server.memoryTotalBytes,
    stats.server.memoryAvailableBytes ?? stats.server.memoryFreeBytes,
  );
  const memoryFree = formatBytes(stats.server.memoryAvailableBytes ?? stats.server.memoryFreeBytes);
  const uptimeSecondsBase = Math.max(0, stats.server.uptimeSeconds || 0);
  const startRef = useRef<number>(Date.now());
  const [tick, setTick] = useState(0);
  useEffect(() => {
    startRef.current = Date.now();
    setTick(0);
  }, [stats.lastUpdated, uptimeSecondsBase]);
  useEffect(() => {
    let rafId = 0;
    const loop = () => {
      setTick((t) => t + 1);
      rafId = window.setTimeout(loop, 1000);
    };
    rafId = window.setTimeout(loop, 1000);
    return () => window.clearTimeout(rafId);
  }, []);
  const totalUptimeSeconds = useMemo(() => {
    const elapsedSec = Math.floor((Date.now() - startRef.current) / 1000);
    return uptimeSecondsBase + Math.max(0, elapsedSec);
  }, [uptimeSecondsBase, tick]);
  const lastUpdatedLabel = formatRelativeTime(stats.lastUpdated);

  const summaryItems: Array<{ label: string; value: string }> = [];
  if (stats.summary) {
    summaryItems.push(
      { label: "Активные подключения", value: formatInteger(stats.summary.activeConnections) },
      { label: "Онлайн пользователей", value: formatInteger(stats.summary.usersOnline) },
      { label: "Пользователи (всего)", value: formatInteger(stats.summary.totalUsers) },
      { label: "Нод доступно", value: formatInteger(nodesOnlineOverride ?? stats.summary.nodesOnline) },
    );
  }

  const bandwidthValue = stats.bandwidth
    ? `${formatBytes(stats.bandwidth.realtimeTotalBytes)} (↓ ${formatBytes(stats.bandwidth.realtimeDownloadBytes)} · ↑ ${formatBytes(stats.bandwidth.realtimeUploadBytes)})`
    : "нет данных";

  return (
    <section className="card glow-border overflow-hidden rounded-3xl border border-outline/50 bg-surface/70 p-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surfaceMuted/80 text-primary">
            <Server className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.32em] text-textMuted/70">RemnaWave</p>
            <h2 className="text-lg font-semibold text-white">Детальная статистика</h2>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:items-end">
          {lastUpdatedLabel ? (
            <span className="text-xs text-textMuted">Обновлено {lastUpdatedLabel}</span>
          ) : null}
          <span className="inline-flex items-center gap-2 rounded-full bg-success/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-success">
            <span className="flex h-2 w-2 items-center justify-center">
              <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
            </span>
            Онлайн
          </span>
        </div>
      </header>

      {stats.summary ? (
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard icon={<Activity className="h-4 w-4 text-primary" />} label="Активные подключения" value={formatInteger(stats.summary.activeConnections)} />
          <KpiCard icon={<Users className="h-4 w-4 text-sky" />} label="Онлайн пользователей" value={formatInteger(stats.summary.usersOnline)} />
          <KpiCard icon={<Users className="h-4 w-4 text-success" />} label="Пользователи (всего)" value={formatInteger(stats.summary.totalUsers)} />
          <KpiCard icon={<Server className="h-4 w-4 text-warning" />} label="Нод доступно" value={formatInteger(nodesOnlineOverride ?? stats.summary.nodesOnline)} />
        </div>
      ) : null}

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard icon={<HardDrive className="h-4 w-4 text-success" />} label="RAM" value={memory.value} hint={`Свободно ${memoryFree}`} />
        <KpiCard icon={<Cpu className="h-4 w-4 text-primary" />} label="CPU" value={cpuValue} />
        <KpiCard icon={<Clock3 className="h-4 w-4 text-warning" />} label="Uptime" value={renderUptime(totalUptimeSeconds)} />
        <KpiCard
          icon={<Wifi className="h-4 w-4 text-sky" />}
          label="Трафик (реалтайм)"
          value={stats.bandwidth ? formatBytes(stats.bandwidth.realtimeTotalBytes) : "нет данных"}
          hint={stats.bandwidth ? `↓ ${formatBytes(stats.bandwidth.realtimeDownloadBytes)} · ↑ ${formatBytes(stats.bandwidth.realtimeUploadBytes)}` : undefined}
        />
      </div>
    </section>
  );
}

function KpiCard({ icon, label, value, hint }: { icon: ReactNode; label: string; value: ReactNode; hint?: string }) {
  const isUnavailable = typeof value === "string" && value === "нет данных";

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-outline/40 bg-surfaceMuted/40 p-3">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface/60">{icon}</span>
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-[0.28em] text-textMuted/70">{label}</p>
        <div className={clsx("truncate text-sm font-semibold text-white", isUnavailable ? "text-textMuted" : undefined)}>{value}</div>
        {hint ? <p className="truncate text-[11px] text-textMuted">{hint}</p> : null}
      </div>
    </div>
  );
}

function SkeletonLine() {
  return <div className="h-9 rounded-xl bg-surfaceMuted/60 animate-pulse" />;
}

function formatCpu(cores: number, physical: number): string {
  if (!Number.isFinite(cores) || cores <= 0) {
    return "нет данных";
  }
  const physicalLabel = Number.isFinite(physical) && physical > 0 ? ` (${physical} физ.)` : "";
  return `${numberFormatter.format(Math.max(0, cores))} ядер${physicalLabel}`;
}

function formatBytes(bytes?: number | null): string {
  if (!Number.isFinite(bytes) || (bytes ?? 0) <= 0) {
    return "нет данных";
  }
  const gigabytes = bytes / BYTES_IN_GB;
  return `${numberFormatter.format(gigabytes)} GB`;
}

function formatInteger(value?: number | null): string {
  if (!Number.isFinite(value) || (value ?? 0) < 0) return "нет данных";
  return new Intl.NumberFormat("ru-RU").format(value ?? 0);
}

function formatMemory(usedBytes?: number | null, totalBytes?: number | null, availableBytes?: number | null): {
  value: string;
  hint?: string;
} {
  if (!Number.isFinite(totalBytes) || (totalBytes ?? 0) <= 0) {
    return { value: "нет данных" };
  }

  const total = Math.max(0, totalBytes ?? 0);
  let used = Math.max(0, usedBytes ?? 0);

  if (Number.isFinite(availableBytes) && (availableBytes ?? 0) >= 0) {
    const available = Math.max(0, availableBytes ?? 0);
    used = Math.max(0, Math.min(total, total - available));
  } else if (used > total) {
    used = total;
  }

  const percent = total > 0 ? (used / total) * 100 : 0;

  return {
    value: `Используется ${numberFormatter.format(used / BYTES_IN_GB)} GB из ${numberFormatter.format(total / BYTES_IN_GB)} GB`,
    hint: `${percentFormatter.format(percent)}%`,
  };
}

function formatUptime(seconds?: number | null): string {
  if (!Number.isFinite(seconds) || (seconds ?? 0) <= 0) {
    return "нет данных";
  }
  const totalSeconds = Math.floor(seconds ?? 0);
  const days = Math.floor(totalSeconds / 86_400);
  const hours = Math.floor((totalSeconds % 86_400) / 3_600);
  if (days > 0 && hours > 0) {
    return `${days}д ${hours}ч`;
  }
  if (days > 0) {
    return `${days}д`;
  }
  if (hours > 0) {
    return `${hours}ч`;
  }
  const minutes = Math.floor((totalSeconds % 3_600) / 60);
  return minutes > 0 ? `${minutes} мин` : `${Math.max(1, totalSeconds)} с`;
}

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

function renderUptime(totalSeconds?: number | null): ReactNode {
  if (!Number.isFinite(totalSeconds) || (totalSeconds ?? 0) <= 0) {
    return "нет данных";
  }
  const secAll = Math.floor(totalSeconds ?? 0);
  const days = Math.floor(secAll / 86_400);
  const hours = Math.floor((secAll % 86_400) / 3_600);
  const minutes = Math.floor((secAll % 3_600) / 60);
  const seconds = secAll % 60;

  return (
    <div className="flex items-center gap-2">
      {days > 0 ? (
        <span className="rounded bg-warning/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-warning">{days}д</span>
      ) : null}
      <div className="rounded-lg bg-surface/60 px-2 py-1 font-mono tabular-nums text-base leading-none text-white sm:text-lg">
        <span>{pad2(hours)}</span>
        <span className="mx-0.5 inline-block animate-pulse">:</span>
        <span>{pad2(minutes)}</span>
        <span className="mx-0.5 inline-block animate-pulse">:</span>
        <span>{pad2(seconds)}</span>
      </div>
    </div>
  );
}

function formatRelativeTime(timestamp?: string): string | null {
  if (!timestamp) {
    return null;
  }
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const now = Date.now();
  const diffMs = date.getTime() - now;
  const diffMinutes = diffMs / 60_000;

  if (Math.abs(diffMinutes) < 1) {
    return diffMs <= 0 ? "менее минуты назад" : "через минуту";
  }
  if (Math.abs(diffMinutes) < 60) {
    return relativeTimeFormatter.format(Math.round(diffMinutes), "minute");
  }

  const diffHours = diffMinutes / 60;
  if (Math.abs(diffHours) < 24) {
    return relativeTimeFormatter.format(Math.round(diffHours), "hour");
  }

  const diffDays = diffHours / 24;
  if (Math.abs(diffDays) < 7) {
    return relativeTimeFormatter.format(Math.round(diffDays), "day");
  }

  return date.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
