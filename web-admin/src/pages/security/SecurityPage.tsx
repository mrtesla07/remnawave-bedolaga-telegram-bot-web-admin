import { useEffect, useMemo, useRef, useState } from "react";
import { apiClient } from "@/lib/api-client";

type Token = {
  id: number;
  name: string;
  prefix: string;
  description?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  expires_at?: string | null;
  last_used_at?: string | null;
  last_used_ip?: string | null;
  created_by?: string | null;
};

type SecurityLogEntry = { time: string; logger: string; level: string; message: string; raw: string };
type LogsResponse = { items: SecurityLogEntry[]; total: number };

type SettingDefinition = { key: string; current: any };

export default function SecurityPage() {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loadingTokens, setLoadingTokens] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newTokenValue, setNewTokenValue] = useState<string | null>(null);

  const [allowedOrigins, setAllowedOrigins] = useState<string>("*");
  const [requestLogging, setRequestLogging] = useState<boolean>(true);
  const [docsEnabled, setDocsEnabled] = useState<boolean>(false);
  const [resetToken, setResetToken] = useState<string>("");
  const [resetIpWhitelist, setResetIpWhitelist] = useState<string>("");
  const [savingBase, setSavingBase] = useState(false);
  const [savingAdmin, setSavingAdmin] = useState(false);

  const [logs, setLogs] = useState<SecurityLogEntry[]>([]);
  const [logLevel, setLogLevel] = useState<string>("WARNING");
  const [loadingLogs, setLoadingLogs] = useState(false);
  const logScrollRef = useRef<HTMLDivElement | null>(null);

  async function loadTokens() {
    try {
      setLoadingTokens(true);
      const { data } = await apiClient.get<Token[]>("/tokens");
      setTokens(data);
    } finally {
      setLoadingTokens(false);
    }
  }

  async function createToken() {
    if (!newName.trim()) return;
    const { data } = await apiClient.post<{ token: string } & Token>("/tokens", { name: newName.trim(), description: newDesc || undefined });
    setNewTokenValue(data.token);
    setNewName("");
    setNewDesc("");
    await loadTokens();
  }

  async function revoke(id: number) {
    await apiClient.post(`/tokens/${id}/revoke`);
    await loadTokens();
  }

  async function activate(id: number) {
    await apiClient.post(`/tokens/${id}/activate`);
    await loadTokens();
  }

  async function removeToken(id: number) {
    if (!confirm("Удалить токен?")) return;
    await apiClient.delete(`/tokens/${id}`);
    await loadTokens();
  }

  async function loadSetting(key: string): Promise<SettingDefinition> {
    const { data } = await apiClient.get<SettingDefinition>(`/settings/${encodeURIComponent(key)}`);
    return data;
  }

  async function loadSettings() {
    try {
      const [origins, logging, docs, adminToken, adminIps] = await Promise.all([
        loadSetting("WEB_API_ALLOWED_ORIGINS"),
        loadSetting("WEB_API_REQUEST_LOGGING"),
        loadSetting("WEB_API_DOCS_ENABLED"),
        loadSetting("ADMIN_RESET_TOKEN"),
        loadSetting("ADMIN_RESET_IP_WHITELIST"),
      ]);
      setAllowedOrigins(String(origins.current ?? "*"));
      setRequestLogging(Boolean(logging.current ?? true));
      setDocsEnabled(Boolean(docs.current ?? false));
      setResetToken(String(adminToken.current ?? ""));
      setResetIpWhitelist(String(adminIps.current ?? ""));
    } catch {}
  }

  async function saveBaseSettings() {
    try {
      setSavingBase(true);
      await apiClient.put(`/settings/${encodeURIComponent("WEB_API_ALLOWED_ORIGINS")}`, { value: allowedOrigins });
      await apiClient.put(`/settings/${encodeURIComponent("WEB_API_REQUEST_LOGGING")}`, { value: requestLogging });
      await apiClient.put(`/settings/${encodeURIComponent("WEB_API_DOCS_ENABLED")}`, { value: docsEnabled });
      alert("Настройки безопасности обновлены");
    } finally {
      setSavingBase(false);
    }
  }

  async function saveAdminSettings() {
    try {
      setSavingAdmin(true);
      await apiClient.put(`/settings/${encodeURIComponent("ADMIN_RESET_TOKEN")}`, { value: resetToken });
      await apiClient.put(`/settings/${encodeURIComponent("ADMIN_RESET_IP_WHITELIST")}`, { value: resetIpWhitelist });
      alert("Настройки админ‑сброса обновлены");
    } finally {
      setSavingAdmin(false);
    }
  }

  async function loadLogs() {
    try {
      setLoadingLogs(true);
      const { data } = await apiClient.get<LogsResponse>("/logs", { params: { level: logLevel, limit: 200 } });
      setLogs(data.items);
      setTimeout(() => {
        const el = logScrollRef.current;
        if (el) el.scrollTop = 0;
      }, 0);
    } finally {
      setLoadingLogs(false);
    }
  }

  useEffect(() => {
    loadTokens();
    loadSettings();
  }, []);

  useEffect(() => { loadLogs(); }, [logLevel]);

  const columns = useMemo(() => [
    { key: "name", label: "Имя" },
    { key: "prefix", label: "Префикс" },
    { key: "status", label: "Статус" },
    { key: "last", label: "Активность" },
    { key: "actions", label: "Действия" },
  ], []);

  return (
    <div className="space-y-8">
      <section className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">Безопасность</h1>
            <p className="text-sm text-textMuted">Управление доступом и настройками безопасности API</p>
          </div>
          <button className="button-ghost" onClick={loadTokens} disabled={loadingTokens}>{loadingTokens ? "Обновление..." : "Обновить"}</button>
        </div>

        <div className="mt-5 grid gap-6 lg:grid-cols-2">
          <div className="space-y-3">
            <h2 className="text-sm font-semibold">Токены доступа</h2>
            <div className="rounded-2xl border border-outline/40">
              <table className="w-full text-sm">
                <thead className="bg-surfaceMuted/60 text-textMuted">
                  <tr>
                    {columns.map((c) => (
                      <th key={c.key} className={"px-3 py-2 text-left font-medium" + (c.key === "actions" ? " text-right" : "")}>{c.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tokens.map((t, idx) => (
                    <tr key={t.id} className="odd:bg-surface/40 animate-logIn" style={{ animationDelay: `${(idx % 20) * 0.01}s` }}>
                      <td className="px-3 py-2 text-xs text-slate-200">{t.name}</td>
                      <td className="px-3 py-2 text-xs">{t.prefix}</td>
                      <td className="px-3 py-2 text-xs">{t.is_active ? "active" : "revoked"}</td>
                      <td className="px-3 py-2 text-[11px] text-textMuted">{t.last_used_at ? `${new Date(t.last_used_at).toLocaleString()} (${t.last_used_ip || "—"})` : "—"}</td>
                      <td className="px-3 py-2 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {t.is_active ? (
                            <button className="button-ghost" onClick={() => revoke(t.id)}>Отозвать</button>
                          ) : (
                            <button className="button-ghost" onClick={() => activate(t.id)}>Активировать</button>
                          )}
                          <button className="button-ghost" onClick={() => removeToken(t.id)}>Удалить</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Массовые операции</h3>
              <button className="button-ghost" onClick={async () => {
                if (!confirm("Отозвать все активные токены?")) return;
                const active = tokens.filter((t) => t.is_active);
                await Promise.all(active.map((t) => apiClient.post(`/tokens/${t.id}/revoke`).catch(() => null)));
                await loadTokens();
                alert("Готово: активные токены отозваны");
              }}>Отозвать все активные</button>
            </div>

            <div className="rounded-2xl border border-outline/40 bg-surfaceMuted/40 p-4">
              <h3 className="text-sm font-semibold">Создать токен</h3>
              <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
                <Field label="Имя" value={newName} onChange={setNewName} />
                <Field label="Описание" value={newDesc} onChange={setNewDesc} />
                <div className="flex items-end">
                  <button className="button-primary" onClick={createToken} disabled={!newName.trim()}>Создать</button>
                </div>
              </div>
              {newTokenValue ? (
                <p className="mt-3 text-xs text-warning">Сохраните токен: <span className="font-mono text-slate-100">{newTokenValue}</span>. Повторно посмотреть его нельзя.</p>
              ) : null}
            </div>

            <h2 className="mt-6 text-sm font-semibold">События безопасности</h2>
            <div className="rounded-2xl border border-outline/40">
              <div className="flex items-center justify-between border-b border-outline/40 bg-surfaceMuted/40 px-3 py-2 text-xs text-textMuted">
                <div className="flex items-center gap-2">
                  <span>Уровень:</span>
                  <select className="rounded-xl border border-outline/40 bg-background/80 px-2 py-1 text-xs" value={logLevel} onChange={(e) => setLogLevel(e.target.value)}>
                    {['ERROR','WARNING','INFO'].map((l) => (<option key={l} value={l}>{l}</option>))}
                  </select>
                </div>
                <button className="button-ghost" onClick={loadLogs} disabled={loadingLogs}>{loadingLogs ? "Загрузка..." : "Обновить"}</button>
              </div>
              <div ref={logScrollRef} className="max-h-[40vh] overflow-auto">
                <table className="w-full text-sm">
                  <thead className="bg-surfaceMuted/60 text-textMuted">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium">Время</th>
                      <th className="px-3 py-2 text-left font-medium">Логгер</th>
                      <th className="px-3 py-2 text-left font-medium">Уровень</th>
                      <th className="px-3 py-2 text-left font-medium">Сообщение</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((it, idx) => (
                      <tr key={`${it.time}-${idx}`} className="odd:bg-surface/40 animate-logIn" style={{ animationDelay: `${(idx % 20) * 0.01}s` }}>
                        <td className="px-3 py-2 text-xs text-textMuted/90">{new Date(it.time).toLocaleString()}</td>
                        <td className="px-3 py-2 text-xs">{it.logger}</td>
                        <td className="px-3 py-2 text-xs">{it.level}</td>
                        <td className="px-3 py-2 text-xs text-slate-200">{it.message || it.raw}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-sm font-semibold">Настройки безопасности</h2>
            <div className="rounded-2xl border border-outline/40 bg-surfaceMuted/40 p-4">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <Field label="Allowed Origins (CORS)" value={allowedOrigins} onChange={setAllowedOrigins} />
                <Toggle label="Логировать запросы" checked={requestLogging} onChange={setRequestLogging} />
                <Toggle label="Включить OpenAPI /docs" checked={docsEnabled} onChange={setDocsEnabled} />
              </div>
              <div className="mt-3">
                <button className="button-primary" onClick={saveBaseSettings} disabled={savingBase}>{savingBase ? "Сохранение..." : "Сохранить"}</button>
              </div>
            </div>

            <h2 className="mt-6 text-sm font-semibold">Админ‑сброс</h2>
            <div className="rounded-2xl border border-outline/40 bg-surfaceMuted/40 p-4">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <Field label="X-Admin-Reset-Token" value={resetToken} onChange={setResetToken} />
                <Field label="IP whitelist (comma)" value={resetIpWhitelist} onChange={setResetIpWhitelist} />
              </div>
              <p className="mt-2 text-xs text-warning">Внимание: эндпоинт /auth/reset-admin удаляет всех админов и создаёт нового. Используйте только при аварийном восстановлении.</p>
              <div className="mt-3 text-xs text-textMuted space-y-2">
                <p>Как использовать:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Запрос: <span className="font-mono text-slate-200">POST /auth/reset-admin</span></li>
                  <li>Заголовок: <span className="font-mono text-slate-200">X-Admin-Reset-Token: &lt;ваш_токен&gt;</span></li>
                  <li>Тело (JSON): <span className="font-mono text-slate-200">{`{ username, password, email?, name? }`}</span></li>
                  <li>IP whitelist: если список не пуст, запрос должен приходить с одного из перечисленных IP.</li>
                </ul>
                <div className="rounded-xl border border-outline/40 bg-background/60 p-3 text-[11px]">
                  <p className="mb-1">Пример:</p>
                  <pre className="whitespace-pre-wrap text-slate-200">{`curl -X POST \
  -H "Content-Type: application/json" \
  -H "X-Admin-Reset-Token: ${resetToken || 'YOUR_TOKEN'}" \
  http://<HOST>:<PORT>/auth/reset-admin \
  -d '{
    "username": "admin",
    "password": "StrongPass123",
    "email": "admin@example.com",
    "name": "Admin"
  }'`}</pre>
                </div>
                <p>
                  Поле <span className="font-mono text-slate-200">IP whitelist</span> — список IP через запятую, например:
                  {" "}
                  <span className="font-mono text-slate-200">127.0.0.1, 10.0.0.5</span>. Пусто — разрешить с любого IP (при корректном токене).
                </p>
              </div>
              <div className="mt-3">
                <button className="button-primary" onClick={saveAdminSettings} disabled={savingAdmin}>{savingAdmin ? "Сохранение..." : "Сохранить"}</button>
              </div>
            </div>

            
          </div>
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

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs uppercase tracking-[0.28em] text-textMuted">{label}</span>
      <input className="w-full rounded-2xl border border-outline/40 bg-background/80 px-3 py-2 text-sm" value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}


