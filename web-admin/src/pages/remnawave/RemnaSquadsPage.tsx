import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";

type Squad = {
  uuid: string;
  name: string;
  members_count: number;
  inbounds_count: number;
  inbounds: any[];
};

export default function RemnaSquadsPage() {
  const [items, setItems] = useState<Squad[]>([]);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [inbounds, setInbounds] = useState<string>("");

  async function load() {
    try {
      setLoading(true);
      const { data } = await apiClient.get<{ items: Squad[]; total: number }>("/remnawave/squads");
      setItems(data.items);
    } catch {}
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function create() {
    const inbound_uuids = inbounds.split(",").map((s) => s.trim()).filter(Boolean);
    await apiClient.post("/remnawave/squads", { name: name.trim(), inbound_uuids });
    setName(""); setInbounds("");
    await load();
  }

  async function rename(uuid: string) {
    const newName = prompt("Новое имя сквада?");
    if (!newName) return;
    await apiClient.patch(`/remnawave/squads/${uuid}`, { name: newName.trim() });
    await load();
  }

  async function updateInbounds(uuid: string) {
    const list = prompt("Список inbound UUID через запятую?");
    if (!list) return;
    const inbound_uuids = list.split(",").map((s) => s.trim()).filter(Boolean);
    await apiClient.post(`/remnawave/squads/${uuid}/actions`, { action: "update_inbounds", inbound_uuids });
    await load();
  }

  async function addAll(uuid: string) {
    await apiClient.post(`/remnawave/squads/${uuid}/actions`, { action: "add_all_users" });
    await load();
  }

  async function removeAll(uuid: string) {
    await apiClient.post(`/remnawave/squads/${uuid}/actions`, { action: "remove_all_users" });
    await load();
  }

  async function remove(uuid: string) {
    if (!confirm("Удалить сквад?")) return;
    await apiClient.post(`/remnawave/squads/${uuid}/actions`, { action: "delete" });
    await load();
  }

  return (
    <div className="space-y-6">
      <section className="p-6">
        <h1 className="text-xl font-semibold">Сквады</h1>
        <p className="text-sm text-textMuted">Управление сквадами и их inbound-ами</p>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
          <label className="block">
            <span className="mb-1 block text-xs uppercase tracking-[0.28em] text-textMuted">Название</span>
            <input className="w-full rounded-2xl border border-outline/40 bg-background/80 px-3 py-2 text-sm" value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <label className="md:col-span-2 block">
            <span className="mb-1 block text-xs uppercase tracking-[0.28em] text-textMuted">Inbound UUIDs (через запятую)</span>
            <input className="w-full rounded-2xl border border-outline/40 bg-background/80 px-3 py-2 text-sm" value={inbounds} onChange={(e) => setInbounds(e.target.value)} />
          </label>
          <div>
            <button className="button-primary" disabled={!name.trim()} onClick={create}>Создать сквад</button>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-outline/40">
          <table className="w-full text-sm">
            <thead className="bg-surfaceMuted/60 text-textMuted">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Имя</th>
                <th className="px-3 py-2 text-left font-medium">Участников</th>
                <th className="px-3 py-2 text-left font-medium">Inbounds</th>
                <th className="px-3 py-2 text-right font-medium">Действия</th>
              </tr>
            </thead>
            <tbody>
              {items.map((s) => (
                <tr key={s.uuid} className="odd:bg-surface/40">
                  <td className="px-3 py-2 text-slate-200">{s.name}</td>
                  <td className="px-3 py-2 text-xs">{s.members_count}</td>
                  <td className="px-3 py-2 text-xs">{s.inbounds_count}</td>
                  <td className="px-3 py-2 text-right space-x-2">
                    <button className="button-ghost" onClick={() => rename(s.uuid)}>Переименовать</button>
                    <button className="button-ghost" onClick={() => updateInbounds(s.uuid)}>Inbounds</button>
                    <button className="button-ghost" onClick={() => addAll(s.uuid)}>Добавить всех</button>
                    <button className="button-ghost" onClick={() => removeAll(s.uuid)}>Удалить всех</button>
                    <button className="button-ghost" onClick={() => remove(s.uuid)}>Удалить</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}


