import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";

export default function RemnaInboundsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  async function load() {
    try {
      setLoading(true);
      const { data } = await apiClient.get<{ items: any[] }>("/remnawave/inbounds");
      setItems(data.items || []);
    } catch {}
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">Inbounds</h1>
            <p className="text-sm text-textMuted">Доступные inbounds в RemnaWave</p>
          </div>
          <button className="button-ghost" onClick={load} disabled={loading}>{loading ? "Обновление..." : "Обновить"}</button>
        </div>

        <div className="mt-4 rounded-2xl border border-outline/40">
          <table className="w-full text-sm">
            <thead className="bg-surfaceMuted/60 text-textMuted">
              <tr>
                <th className="px-3 py-2 text-left font-medium">UUID</th>
                <th className="px-3 py-2 text-left font-medium">Название</th>
                <th className="px-3 py-2 text-left font-medium">Тип</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, idx) => (
                <tr key={it.uuid || idx} className="odd:bg-surface/40">
                  <td className="px-3 py-2 text-xs text-textMuted/90">{it.uuid || "—"}</td>
                  <td className="px-3 py-2 text-slate-200">{it.name || it.title || "—"}</td>
                  <td className="px-3 py-2 text-xs">{it.type || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


