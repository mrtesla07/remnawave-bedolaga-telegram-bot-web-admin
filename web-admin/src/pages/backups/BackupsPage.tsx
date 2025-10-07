import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { apiClient } from "@/lib/api-client";

type BackupInfo = {
  filename: string;
  filepath: string;
  timestamp?: string | null;
  tables_count?: number | null;
  total_records?: number | null;
  compressed: boolean;
  file_size_bytes: number;
  file_size_mb: number;
  created_by?: number | null;
  database_type?: string | null;
  version?: string | null;
  error?: string | null;
};

type BackupListResponse = { items: BackupInfo[]; total: number; limit: number; offset: number };
type CreateResponse = { task_id: string; status: string };
type TaskItem = { task_id: string; status: string; message?: string | null; file_path?: string | null; created_by?: number | null; created_at?: string | null; updated_at?: string | null };
type TaskListResponse = { items: TaskItem[]; total: number };
type StatusResponse = TaskItem & {};
type BackupSettings = {
  auto_backup_enabled: boolean;
  backup_interval_hours: number;
  backup_time: string;
  max_backups_keep: number;
  compression_enabled: boolean;
  include_logs: boolean;
  backup_location: string;
};

function formatBytesMB(sizeMb?: number) {
  if (!sizeMb || sizeMb <= 0) return "0 MB";
  return `${sizeMb.toFixed(2)} MB`;
}

export default function BackupsPage() {
  const [items, setItems] = useState<BackupInfo[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [lastTaskId, setLastTaskId] = useState<string | null>(null);
  const pollRef = useRef<number | null>(null);
  const [settings, setSettings] = useState<BackupSettings | null>(null);

  const loadList = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await apiClient.get<BackupListResponse>("/backups", { params: { limit: 100, offset: 0 } });
      setItems(data.items);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadTasks = useCallback(async () => {
    const { data } = await apiClient.get<TaskListResponse>("/backups/tasks", { params: { active_only: true } });
    setTasks(data.items);
  }, []);

  const loadSettings = useCallback(async () => {
    const { data } = await apiClient.get<BackupSettings>("/backups/settings");
    setSettings(data);
  }, []);

  async function createBackup() {
    try {
      setCreating(true);
      const { data } = await apiClient.post<CreateResponse>("/backups");
      setLastTaskId(data.task_id);
      await loadTasks();
      startPolling();
    } finally {
      setCreating(false);
    }
  }

  async function restore(filepath: string) {
    if (!filepath) return;
    const ok = confirm(`Восстановить данные из бекапа\n${filepath}\n\nТекущие данные могут быть перезаписаны.`);
    if (!ok) return;
    await apiClient.post(`/backups/restore`, null, { params: { filepath, clear_existing: false } });
    alert("Восстановление запущено. Проверьте логи/данные после завершения.");
  }

  function startPolling() {
    stopPolling();
    pollRef.current = window.setInterval(async () => {
      try {
        await loadTasks();
        if (lastTaskId) {
          const { data } = await apiClient.get<StatusResponse>(`/backups/status/${lastTaskId}`);
          if (data.status && ["done", "error"].includes(data.status)) {
            stopPolling();
            await loadList();
          }
        }
      } catch {}
    }, 2000) as unknown as number;
  }

  function stopPolling() {
    if (pollRef.current) {
      window.clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }

  useEffect(() => {
    loadList();
    loadTasks();
    loadSettings();
    return () => stopPolling();
  }, [loadList, loadTasks, loadSettings]);

  const hasActive = useMemo(() => tasks.some((t) => ["queued", "running"].includes(t.status)), [tasks]);

  return (
    <div className="space-y-6">
      <section className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">Резервные копии</h1>
            <p className="text-sm text-textMuted">Создание и управление бекапами базы данных</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="button-ghost" onClick={loadList} disabled={loading}>{loading ? "Обновление..." : "Обновить"}</button>
            <button className="button-primary" onClick={createBackup} disabled={creating || hasActive}>{creating ? "Запуск..." : "Создать бекап"}</button>
          </div>
        </div>

        {settings ? (
          <div className="mt-4 rounded-2xl border border-outline/40 bg-surfaceMuted/40 p-4">
            <div className="flex flex-wrap gap-3">
              <Toggle label="Авто-бекапы" checked={settings.auto_backup_enabled} onChange={(v) => updateSetting({ auto_backup_enabled: v })} />
              <Field label="Интервал (ч)" value={String(settings.backup_interval_hours)} onChange={(v) => updateSetting({ backup_interval_hours: Number(v) || 24 })} />
              <Field label="Время" value={settings.backup_time} onChange={(v) => updateSetting({ backup_time: v })} />
              <Field label="Хранить, шт" value={String(settings.max_backups_keep)} onChange={(v) => updateSetting({ max_backups_keep: Number(v) || 7 })} />
              <Toggle label="Сжатие" checked={settings.compression_enabled} onChange={(v) => updateSetting({ compression_enabled: v })} />
              <Toggle label="Включать логи" checked={settings.include_logs} onChange={(v) => updateSetting({ include_logs: v })} />
              <Field label="Папка" value={settings.backup_location} onChange={(v) => updateSetting({ backup_location: v })} wide />
            </div>
          </div>
        ) : null}

        {tasks.length > 0 ? (
          <div className="mt-4 rounded-2xl border border-outline/40 bg-surfaceMuted/40">
            <div className="flex items-center justify-between border-b border-outline/40 px-4 py-2 text-xs text-textMuted">
              <span>Активные задачи</span>
              <button className="button-ghost" onClick={loadTasks}>Обновить</button>
            </div>
            <ul className="divide-y divide-outline/40">
              {tasks.map((t) => (
                <li key={t.task_id} className="px-4 py-3 animate-logIn">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-200">Задача {t.task_id}</p>
                      <p className="text-xs text-textMuted">{t.status} · {t.message || "выполняется"}</p>
                    </div>
                    <div className="w-40">
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface/60">
                        <div className="h-full rounded-full bg-gradient-to-r from-primary/80 to-sky/70 animate-pulse" style={{ width: ["queued","running"].includes(t.status) ? "75%" : "100%" }} />
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="mt-4 overflow-hidden rounded-2xl border border-outline/40">
          <table className="w-full text-sm">
            <thead className="bg-surfaceMuted/60 text-textMuted">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Файл</th>
                <th className="px-3 py-2 text-left font-medium">Дата</th>
                <th className="px-3 py-2 text-left font-medium">Размер</th>
                <th className="px-3 py-2 text-left font-medium">Таблиц</th>
                <th className="px-3 py-2 text-left font-medium">Записей</th>
                <th className="px-3 py-2 text-left font-medium">БД</th>
                <th className="px-3 py-2 text-left font-medium">Версия</th>
                <th className="px-3 py-2 text-right font-medium">Действия</th>
              </tr>
            </thead>
            <tbody>
              {items.map((b, idx) => (
                <tr key={b.filename} className="odd:bg-surface/40 animate-logIn" style={{ animationDelay: `${(idx % 20) * 0.01}s` }}>
                  <td className="px-3 py-2 text-xs text-slate-200">{b.filename}</td>
                  <td className="px-3 py-2 text-xs text-textMuted/90">{b.timestamp ? new Date(b.timestamp).toLocaleString() : "—"}</td>
                  <td className="px-3 py-2 text-xs">{formatBytesMB(b.file_size_mb)}</td>
                  <td className="px-3 py-2 text-xs">{b.tables_count ?? "—"}</td>
                  <td className="px-3 py-2 text-xs">{b.total_records ?? "—"}</td>
                  <td className="px-3 py-2 text-xs">{b.database_type ?? "—"}</td>
                  <td className="px-3 py-2 text-xs">{b.version ?? "—"}</td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <a className="button-ghost" href={`/${b.filepath}`} download>
                        Скачать
                      </a>
                      <button className="button-ghost" onClick={() => restore(b.filepath)}>Восстановить</button>
                      <button className="button-ghost" onClick={() => remove(b.filename)}>Удалить</button>
                    </div>
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

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 rounded-2xl border border-outline/40 bg-background/60 px-3 py-2 text-sm">
      <input type="checkbox" className="accent-primary" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="text-textMuted">{label}</span>
    </label>
  );
}

function Field({ label, value, onChange, wide }: { label: string; value: string; onChange: (v: string) => void; wide?: boolean }) {
  return (
    <label className={"block " + (wide ? "min-w-[320px] grow" : "") }>
      <span className="mb-1 block text-xs uppercase tracking-[0.28em] text-textMuted">{label}</span>
      <input className="w-full rounded-2xl border border-outline/40 bg-background/80 px-3 py-2 text-sm" value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

async function updateSetting(values: Partial<BackupSettings>) {
  await apiClient.put("/backups/settings", values);
}

async function remove(filename: string) {
  if (!confirm(`Удалить бекап ${filename}?`)) return;
  await apiClient.delete(`/backups/${encodeURIComponent(filename)}`);
  window.location.reload();
}


