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
                <th className="px-3 py-2 text-left font-medium">Статус</th>
                <th className="px-3 py-2 text-left font-medium">Онлайн</th>
                <th className="px-3 py-2 text-right font-medium">Действия</th>
              </tr>
            </thead>
            <tbody>
              {nodes.map((n) => {
                const status = getNodeStatus(n);
                return (
                  <tr key={n.uuid} className="odd:bg-surface/40">
                    <td className="px-3 py-2 text-slate-200">{n.name}</td>
                    <td className="px-3 py-2 text-xs text-textMuted/90">{n.address}</td>
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


