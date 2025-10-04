import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";

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
  traffic_used_bytes?: number | null;
  traffic_limit_bytes?: number | null;
};

function formatBytes(bytes?: number | null) {
  if (!bytes || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const val = bytes / Math.pow(1024, i);
  return `${val.toFixed(1)} ${units[i]}`;
}

function TrafficCell({ used, limit }: { used?: number | null; limit?: number | null }) {
  const usedVal = typeof used === "number" && used > 0 ? used : 0;
  const limitVal = typeof limit === "number" && limit > 0 ? limit : 0;
  const percent = limitVal > 0 ? Math.min(100, Math.max(0, Math.round((usedVal / limitVal) * 100))) : null;

  return (
    <div className="min-w-[180px]">
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="text-slate-200">{formatBytes(usedVal)}</span>
        <span className="text-textMuted">/ {limitVal > 0 ? formatBytes(limitVal) : "—"}</span>
      </div>
      {percent !== null ? (
        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-surfaceMuted/60">
          <div className="h-full rounded-full bg-gradient-to-r from-primary/80 to-sky/70" style={{ width: `${percent}%` }} />
        </div>
      ) : null}
    </div>
  );
}

export default function RemnaNodesPage() {
  const [nodes, setNodes] = useState<NodeItem[]>([]);
  const [loading, setLoading] = useState(false);

  async function load() {
    try {
      setLoading(true);
      const { data } = await apiClient.get<{ items: NodeItem[]; total: number }>("/remnawave/nodes");
      setNodes(data.items);
    } catch {}
    finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function action(uuid: string, act: "enable" | "disable" | "restart") {
    try {
      await apiClient.post(`/remnawave/nodes/${uuid}/actions`, { action: act });
      await load();
    } catch {}
  }

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">Ноды</h1>
            <p className="text-sm text-textMuted">Список нод RemnaWave</p>
          </div>
          <button className="button-ghost" onClick={load} disabled={loading}>{loading ? "Обновление..." : "Обновить"}</button>
        </div>

        <div className="mt-4 rounded-2xl border border-outline/40">
          <table className="w-full text-sm">
            <thead className="bg-surfaceMuted/60 text-textMuted">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Имя</th>
                <th className="px-3 py-2 text-left font-medium">Адрес</th>
                <th className="px-3 py-2 text-left font-medium">Трафик</th>
                <th className="px-3 py-2 text-left font-medium">Статус</th>
                <th className="px-3 py-2 text-left font-medium">Онлайн</th>
                <th className="px-3 py-2 text-right font-medium">Действия</th>
              </tr>
            </thead>
            <tbody>
              {nodes.map((n) => {
                const status = getNodeStatus(n);
                const hasQuota = typeof n.traffic_limit_bytes === "number" && n.traffic_limit_bytes > 0;
                return (
                  <tr key={n.uuid} className="odd:bg-surface/40">
                    <td className="px-3 py-2 text-slate-200">{n.name}</td>
                    <td className="px-3 py-2 text-xs text-textMuted/90">{n.address}</td>
                    <td className="px-3 py-2 text-xs">
                      <TrafficCell used={n.traffic_used_bytes} limit={hasQuota ? n.traffic_limit_bytes : 0} />
                    </td>
                    <td className="px-3 py-2 text-xs">
                      <span className={status.cls}>{status.label}</span>
                    </td>
                    <td className="px-3 py-2 text-xs">{Number.isFinite(n.users_online as any) ? (n.users_online ?? 0) : 0}</td>
                    <td className="px-3 py-2 text-right space-x-2">
                      <button className="button-ghost" onClick={() => action(n.uuid, "restart")}>Перезапуск</button>
                      {n.is_disabled ? (
                        <button className="button-primary" onClick={() => action(n.uuid, "enable")}>Включить</button>
                      ) : (
                        <button className="button-ghost" onClick={() => action(n.uuid, "disable")}>Отключить</button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function getNodeStatus(n: {
  is_disabled: boolean;
  is_connected: boolean;
  is_node_online: boolean;
  is_xray_running: boolean;
}): { label: string; cls: string } {
  if (n.is_disabled) return { label: "disabled", cls: "text-textMuted" };
  const online = n.is_connected && n.is_node_online && n.is_xray_running;
  if (online) return { label: "online", cls: "text-success" };
  const degraded = n.is_connected || n.is_node_online || n.is_xray_running;
  if (degraded) return { label: "degraded", cls: "text-warning" };
  return { label: "offline", cls: "text-danger" };
}


