import { subDays } from "date-fns";
import type { AxiosError } from "axios";
import { apiClient } from "@/lib/api-client";
import type { OverviewStats, RemnawaveSystemStats, RevenuePoint, ServerCardData } from "@/types/dashboard";

interface StatsOverviewResponse {
  users: {
    total: number;
    active: number;
    blocked: number;
    balance_kopeks?: number;
    balance_rubles?: number;
  };
  subscriptions: {
    active: number;
    expired: number;
  };
  support: {
    open_tickets: number;
  };
  payments: {
    today_kopeks?: number;
    today_rubles?: number;
  };
}

interface TransactionResponse {
  id: number;
  amount_kopeks: number;
  amount_rubles: number;
  created_at: string;
  type: string;
}

interface TransactionListResponse {
  items: TransactionResponse[];
  total: number;
  limit: number;
  offset: number;
}

interface RemnawaveSystemResponse {
  server_info?: {
    cpu_cores?: number | string;
    cpu_physical_cores?: number | string;
    memory_total?: number | string;
    memory_used?: number | string;
    memory_free?: number | string;
    memory_available?: number | string;
    uptime_seconds?: number | string;
  };
  last_updated?: string;
}

interface RemnaWaveNodeDto {
  uuid: string;
  name: string;
  address: string;
  country_code?: string;
  is_connected: boolean;
  is_disabled: boolean;
  is_node_online: boolean;
  is_xray_running: boolean;
  users_online?: number;
  traffic_used_bytes?: number;
  traffic_limit_bytes?: number;
}

interface RemnaWaveNodeListResponse {
  items: RemnaWaveNodeDto[];
  total: number;
}

interface NodeStatisticsResponse {
  node: RemnaWaveNodeDto;
  realtime?: Record<string, unknown>;
  usage_history: Array<Record<string, unknown>>;
  last_updated?: string;
}

const TB_IN_BYTES = 1024 ** 4;

export async function fetchOverviewStats(): Promise<OverviewStats> {
  const { data } = await apiClient.get<StatsOverviewResponse>("/stats/overview");

  const balanceKopeks = Math.round(
    data.users.balance_kopeks ?? (data.users.balance_rubles ?? 0) * 100,
  );
  const balanceRubles = data.users.balance_rubles ?? Math.round(balanceKopeks) / 100;

  const paymentsKopeks = Math.round(
    data.payments.today_kopeks ?? (data.payments.today_rubles ?? 0) * 100,
  );
  const paymentsRubles = data.payments.today_rubles ?? Math.round(paymentsKopeks) / 100;

  return {
    users: {
      total: data.users.total,
      active: data.users.active,
      blocked: data.users.blocked,
      balanceRubles,
      balanceKopeks,
    },
    subscriptions: {
      active: data.subscriptions.active,
      expired: data.subscriptions.expired,
    },
    payments: {
      todayRubles: paymentsRubles,
      todayKopeks: paymentsKopeks,
    },
    support: {
      openTickets: data.support.open_tickets,
    },
  };
}

export async function fetchRevenueTrend(): Promise<RevenuePoint[]> {
  const dateFrom = subDays(new Date(), 29).toISOString().slice(0, 19);
  const totals = new Map<string, number>();

  const limit = 200;
  let offset = 0;
  let total = 0;

  do {
    const { data } = await apiClient.get<TransactionListResponse>("/transactions", {
      params: {
        limit,
        offset,
        type: "deposit",
        date_from: dateFrom,
      },
    });

    data.items.forEach((item) => {
      const day = item.created_at.slice(0, 10);
      const prev = totals.get(day) ?? 0;
      totals.set(day, prev + item.amount_kopeks);
    });

    offset += data.items.length;
    total = data.total;
  } while (offset < total);

  const result: RevenuePoint[] = [];
  const cursor = subDays(new Date(), 29);
  for (let i = 0; i < 30; i += 1) {
    const date = new Date(cursor);
    date.setDate(cursor.getDate() + i);
    const key = date.toISOString().slice(0, 10);
    const value = totals.get(key) ?? 0;
    result.push({ date: `${key}T00:00:00Z`, value: Math.round((value / 100) * 100) / 100 });
  }

  return result;
}

function resolveStatus(node: RemnaWaveNodeDto): "online" | "degraded" | "offline" {
  if (!node.is_connected || node.is_disabled) {
    return "offline";
  }
  if (!node.is_node_online || !node.is_xray_running) {
    return "degraded";
  }
  return "online";
}

function readNumber(input: unknown, fallback = 0): number {
  if (typeof input === "number" && Number.isFinite(input)) {
    return input;
  }
  if (typeof input === "string") {
    const parsed = Number.parseFloat(input);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return fallback;
}

function roundTo(value: number, decimals = 0): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function toMbps(speedBps: number): number {
  if (!Number.isFinite(speedBps) || speedBps <= 0) {
    return 0;
  }
  return roundTo((speedBps * 8) / 1_000_000, 1);
}

function pickMetric(source: Record<string, unknown>, keys: string[], fallback = 0): number {
  for (const key of keys) {
    if (key in source) {
      const value = readNumber((source as Record<string, unknown>)[key], Number.NaN);
      if (!Number.isNaN(value)) {
        return value;
      }
    }
  }
  return fallback;
}

function pickString(source: Record<string, unknown>, keys: string[]): string | undefined {
  for (const key of keys) {
    if (key in source) {
      const value = (source as Record<string, unknown>)[key];
      if (typeof value === "string" && value.trim().length > 0) {
        return value;
      }
    }
  }
  return undefined;
}


function mapHistory(items: Array<Record<string, unknown>>): RevenuePoint[] {
  return items
    .map((item) => {
      const dateRaw = item.timestamp ?? item.time ?? item.date ?? "";
      const date = typeof dateRaw === "string" ? dateRaw : String(dateRaw ?? "");
      if (!date) return null;

      const rawValue = readNumber(
        item.value ??
          item.total ??
          item.totalBytes ??
          item.bytes ??
          item.bandwidth ??
          item.usage ??
          item.downloadBytes ??
          item.uploadBytes ??
          0,
        0,
      );

      const value = rawValue > 0 && rawValue > 1024 * 1024 ? roundTo(rawValue / 1024 ** 3, 2) : rawValue;
      return { date, value } as RevenuePoint;
    })
    .filter((point): point is RevenuePoint => point !== null);
}

export async function fetchRemnawaveSystem(): Promise<RemnawaveSystemStats> {
  const { data } = await apiClient.get<RemnawaveSystemResponse>("/remnawave/system");
  const info = data.server_info ?? {};

  const memoryAvailableBytes = readNumber(info.memory_available, 0);

  const server = {
    cpuCores: readNumber(info.cpu_cores, 0),
    cpuPhysicalCores: readNumber(info.cpu_physical_cores, 0),
    memoryTotalBytes: readNumber(info.memory_total, 0),
    memoryUsedBytes: readNumber(info.memory_used, 0),
    memoryFreeBytes: readNumber(info.memory_free, 0),
    memoryAvailableBytes: memoryAvailableBytes > 0 ? memoryAvailableBytes : undefined,
    uptimeSeconds: readNumber(info.uptime_seconds, 0),
  };

  return {
    server,
    lastUpdated: typeof data.last_updated === "string" ? data.last_updated : undefined,
  };
}

export async function fetchServers(): Promise<ServerCardData[]> {
  try {
    const { data } = await apiClient.get<RemnaWaveNodeListResponse>("/remnawave/nodes");
    const nodes = data.items ?? [];

    const detailed = await Promise.all(
      nodes.map(async (node) => {
        try {
          const { data: stats } = await apiClient.get<NodeStatisticsResponse>(`/remnawave/nodes/${node.uuid}/statistics`);
          return stats;
        } catch (error) {
          const axiosError = error as AxiosError;
          if (axiosError.response?.status === 404) {
            return { node, usage_history: [] } as NodeStatisticsResponse;
          }
          throw error;
        }
      }),
    );

    return detailed.map((detail) => {
      const node = detail.node;
      const realtime = (detail.realtime ?? {}) as Record<string, unknown>;
      const status = resolveStatus(node);

      const downloadSpeedBps = pickMetric(realtime, [
        "downloadSpeedBps",
        "download_speed_bps",
        "downloadSpeed",
        "downloadSpeedBytes",
        "downloadSpeedBytesPerSecond",
        "downSpeedBps",
        "download_bps",
      ]);
      const uploadSpeedBps = pickMetric(realtime, [
        "uploadSpeedBps",
        "upload_speed_bps",
        "uploadSpeed",
        "uploadSpeedBytes",
        "uploadSpeedBytesPerSecond",
        "upSpeedBps",
        "upload_bps",
      ]);
      const downloadBytes = pickMetric(realtime, [
        "downloadBytes",
        "downloadTotalBytes",
        "download",
        "downBytes",
        "download_bytes",
      ]);
      const uploadBytes = pickMetric(realtime, [
        "uploadBytes",
        "uploadTotalBytes",
        "upload",
        "upBytes",
        "upload_bytes",
      ]);
      const realtimeTotalBytes = pickMetric(
        realtime,
        [
          "totalBytes",
          "total",
          "bandwidthBytes",
          "realtimeTotalBytes",
        ],
        downloadBytes + uploadBytes,
      );
      const trafficBytes = realtimeTotalBytes > 0 ? realtimeTotalBytes : readNumber(node.traffic_used_bytes, 0);
      const trafficTb = trafficBytes > 0 ? roundTo(trafficBytes / TB_IN_BYTES, 2) : 0;

      const pingMsRaw = pickMetric(realtime, ["latencyMs", "pingMs", "ping_ms", "latency", "ping"], 0);
      const pingMs = pingMsRaw > 0 ? roundTo(pingMsRaw, 0) : 0;

      const cpuUsagePercentRaw = pickMetric(
        realtime,
        ["cpuUsagePercent", "cpuPercent", "cpu_percent", "cpuUsage", "cpu"],
        0,
      );
      const ramUsagePercentRaw = pickMetric(
        realtime,
        [
          "memoryUsagePercent",
          "memoryPercent",
          "memory_percent",
          "ramUsagePercent",
          "ramPercent",
          "memoryUsage",
          "ram",
        ],
        0,
      );
      const temperatureCRaw = pickMetric(realtime, ["temperatureC", "temperature_c", "temperature", "tempC", "temp"], 0);

      const uptimeHoursRealtime = pickMetric(realtime, ["uptimeHours", "uptime_hours", "uptimeH"], 0);
      const uptimeSeconds = pickMetric(realtime, ["uptimeSeconds", "uptime_sec", "uptime"], 0);
      const uptimeHours = uptimeHoursRealtime > 0 ? uptimeHoursRealtime : uptimeSeconds > 0 ? uptimeSeconds / 3600 : 0;
      const uptimePercentRaw = pickMetric(realtime, ["uptimePercent", "uptime_percent", "uptimeRatio", "uptime_ratio"], 0);
      const uptimePercent = uptimePercentRaw > 0 ? roundTo(uptimePercentRaw, 1) : 100;

      const downloadMbps = toMbps(downloadSpeedBps);
      const uploadMbps = toMbps(uploadSpeedBps);

      const cpuUsagePercent = roundTo(cpuUsagePercentRaw, 1);
      const ramUsagePercent = roundTo(ramUsagePercentRaw, 1);
      const temperatureC = roundTo(temperatureCRaw, 1);
      const normalizedUptimeHours = uptimeHours > 0 ? Math.max(0, Math.round(uptimeHours)) : 0;

      const realtimeUsersOnline = pickMetric(realtime, ["onlineUsers", "usersOnline", "clientsOnline"], 0);
      const usersOnline = realtimeUsersOnline > 0 ? Math.round(realtimeUsersOnline) : node.users_online ?? 0;

      const history = mapHistory(detail.usage_history ?? []);

      const locationParts = (node.address ?? "").split(",").map((part) => part.trim()).filter(Boolean);
      const provider = locationParts[1] ?? locationParts[0] ?? "RemnaWave";
      const countryCode = (() => {
        const candidates = [
          node.country_code ?? "",
          locationParts.find((part) => /^[A-Za-z]{2}$/i.test(part)) ?? "",
          locationParts[0] ?? "",
        ]
          .map((value) => value.toString().trim())
          .filter((value) => value.length > 0);
        const pick = candidates.length ? candidates[0] : "";
        if (!pick) return "";
        const upper = pick.toUpperCase();
        if (upper.length === 2) return upper;
        return upper.slice(-2);
      })();

      const realtimeUpdatedAt =
        pickString(realtime, ["timestamp", "updatedAt", "updated_at", "lastUpdated", "last_updated"]) ||
        (typeof detail.last_updated === "string" ? detail.last_updated : undefined);

      const hasSpeedData = downloadSpeedBps > 0 || uploadSpeedBps > 0;
      const formatMbpsLabel = (value: number) => roundTo(value, 1).toFixed(1);

      const server: ServerCardData = {
        id: node.uuid,
        name: node.name || provider,
        location: node.address || provider,
        provider,
        countryCode,
        status,
        pingMs,
        downloadMbps,
        uploadMbps,
        downloadSpeedBps,
        uploadSpeedBps,
        downloadBytes,
        uploadBytes,
        trafficTb,
        trafficBytes,
        realtimeTotalBytes,
        temperatureC,
        uptimeHours: normalizedUptimeHours,
        uptimePercent,
        cpuUsagePercent,
        ramUsagePercent,
        usersOnline,
        realtimeUpdatedAt,
        metrics: [
          { label: "Пользователи", value: String(usersOnline), hint: "онлайн" },
          {
            label: "Скорость",
            value: hasSpeedData ? `${formatMbpsLabel(downloadMbps)} / ${formatMbpsLabel(uploadMbps)} Mbps` : "n/a",
            hint: "↓ / ↑",
          },
          { label: "CPU", value: `${Math.round(cpuUsagePercent)}%`, badgeColor: cpuUsagePercent > 65 ? "warning" : "success" },
          { label: "RAM", value: `${Math.round(ramUsagePercent)}%` },
        ],
        history,
      };

      return server;
    });
  } catch (error) {
    const axiosError = error as AxiosError;
    if (axiosError.response?.status === 503) {
      return [];
    }
    throw error;
  }
}



