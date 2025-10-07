import { useEffect, useMemo, useState } from "react";
import { apiClient } from "@/lib/api-client";

type StatusResponse = {
  is_configured: boolean;
  configuration_error?: string | null;
  connection?: {
    status: string;
    message: string;
    api_url?: string | null;
    status_code?: number | null;
    system_info?: Record<string, any> | null;
  } | null;
};

type SystemResponse = {
  system: {
    users_online: number;
    total_users: number;
    active_connections: number;
    nodes_online: number;
    users_last_day: number;
    users_last_week: number;
    users_never_online: number;
    total_user_traffic: number; // bytes
  };
  users_by_status: Record<string, number>;
  server_info: {
    cpu_cores: number;
    cpu_physical_cores: number;
    memory_total: number;
    memory_used: number;
    memory_free: number;
    memory_available: number;
    uptime_seconds: number;
  };
  bandwidth: {
    realtime_download: number;
    realtime_upload: number;
    realtime_total: number;
  };
  traffic_periods: any;
  last_updated?: string | null;
};

type NodeItem = {
  uuid: string;
  name: string;
  address: string;
  country_code?: string | null;
  is_connected: boolean;
  is_disabled: boolean;
  is_node_online: boolean;
  is_xray_running: boolean;
  users_online?: number | null;
};

function formatBytes(bytes?: number) {
  if (!bytes || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const val = bytes / Math.pow(1024, i);
  return `${val.toFixed(1)} ${units[i]}`;
}

function ProgressBar({ percent }: { percent: number }) {
  const clamped = Math.max(0, Math.min(100, Math.round(percent)));
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-surfaceMuted/60">
      <div className="h-full rounded-full bg-gradient-to-r from-primary/80 to-sky/70" style={{ width: `${clamped}%` }} />
    </div>
  );
}

export default function RemnaOverviewPage() {
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [system, setSystem] = useState<SystemResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [nodesOnline, setNodesOnline] = useState<number | null>(null);

  async function load() {
    try {
      setLoading(true);
      const [statusRes, sysRes, nodesRes] = await Promise.all([
        apiClient.get<StatusResponse>("/remnawave/status"),
        apiClient.get<SystemResponse>("/remnawave/system"),
        apiClient.get<{ items: NodeItem[]; total: number }>("/remnawave/nodes"),
      ]);
      setStatus(statusRes.data);
      setSystem(sysRes.data);
      const nodes = nodesRes.data?.items || [];
      const count = nodes.filter((n) => {
        if (n.is_disabled) return false;
        return n.is_connected && n.is_node_online && n.is_xray_running;
      }).length;
      setNodesOnline(count);
    } catch (e) {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const memPercent = useMemo(() => {
    const info = system?.server_info;
    if (!info) return 0;
    const total = info.memory_total || 0;
    if (!total) return 0;
    // Если есть memory_available, считаем занято как (total - available)
    const used = (typeof info.memory_available === "number" && info.memory_available >= 0)
      ? Math.max(0, total - info.memory_available)
      : info.memory_used;
    if (!used && used !== 0) return 0;
    return (used / total) * 100;
  }, [system]);

  return (
    <div className="space-y-8">
      <section className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">RemnaWave · Обзор</h1>
            <p className="text-sm text-textMuted">Статус интеграции и системные метрики</p>
          </div>
          <button className="button-ghost" onClick={load} disabled={loading}>{loading ? "Обновление..." : "Обновить"}</button>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-2xl border border-outline/40 p-4">
            <p className="text-xs uppercase tracking-[0.28em] text-textMuted">Статус подключения</p>
            <div className="mt-2 text-sm">
              <p className="text-slate-200">{status?.connection?.status || (status?.is_configured ? "configured" : "not configured")}</p>
              {status?.connection?.api_url ? (
                <p className="text-textMuted text-xs">API: {status.connection.api_url}</p>
              ) : null}
              {status?.configuration_error ? (
                <p className="mt-1 text-xs text-danger">{status.configuration_error}</p>
              ) : null}
            </div>
          </div>

          <div className="rounded-2xl border border-outline/40 p-4">
            <p className="text-xs uppercase tracking-[0.28em] text-textMuted">Активные пользователи</p>
            <p className="mt-2 text-2xl font-semibold">{system?.system.users_online ?? 0}</p>
            <p className="text-xs text-textMuted">Всего: {system?.system.total_users ?? 0}</p>
          </div>

          <div className="rounded-2xl border border-outline/40 p-4">
            <p className="text-xs uppercase tracking-[0.28em] text-textMuted">Ноды онлайн</p>
            <p className="mt-2 text-2xl font-semibold">{nodesOnline ?? system?.system.nodes_online ?? 0}</p>
            <p className="text-xs text-textMuted">Активных подключений: {system?.system.active_connections ?? 0}</p>
          </div>

          <div className="rounded-2xl border border-outline/40 p-4">
            <p className="text-xs uppercase tracking-[0.28em] text-textMuted">Трафик (суммарно)</p>
            <p className="mt-2 text-2xl font-semibold">{formatBytes(system?.system.total_user_traffic)}</p>
            <p className="text-xs text-textMuted">Скорость сейчас: ↓ {formatBytes(system?.bandwidth?.realtime_download)} · ↑ {formatBytes(system?.bandwidth?.realtime_upload)}</p>
          </div>

          <div className="rounded-2xl border border-outline/40 p-4">
            <p className="text-xs uppercase tracking-[0.28em] text-textMuted">Память сервера</p>
            <div className="mt-2 flex items-end justify-between">
              <p className="text-2xl font-semibold">{memPercent.toFixed(0)}%</p>
              <p className="text-xs text-textMuted">
                {formatBytes((system?.server_info.memory_total || 0) - (system?.server_info.memory_available ?? system?.server_info.memory_free ?? 0))}
                {" "}/ {formatBytes(system?.server_info.memory_total)}
              </p>
            </div>
            <div className="mt-2"><ProgressBar percent={memPercent} /></div>
            <p className="mt-2 text-xs text-textMuted">Ядер CPU: {system?.server_info.cpu_physical_cores ?? system?.server_info.cpu_cores ?? 0}</p>
          </div>

          <div className="rounded-2xl border border-outline/40 p-4">
            <p className="text-xs uppercase tracking-[0.28em] text-textMuted">Аптайм</p>
            <p className="mt-2 text-2xl font-semibold">{Math.floor(((system?.server_info.uptime_seconds ?? 0) / 3600))} ч</p>
          </div>
        </div>
      </section>
    </div>
  );
}



