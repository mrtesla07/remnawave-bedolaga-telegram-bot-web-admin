import { useEffect, useMemo, useRef, useState } from "react";
import { apiClient } from "@/lib/api-client";

type LogEntry = {
  time: string;
  logger: string;
  level: string;
  message: string;
  raw: string;
};

type LogListResponse = { items: LogEntry[]; total: number };

export default function LogsPage() {
  const [items, setItems] = useState<LogEntry[]>([]);
  const [level, setLevel] = useState<string>("");
  const [query, setQuery] = useState<string>("");
  const [path, setPath] = useState<string>("logs/bot.log");
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState<number>(150);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const lastTopRef = useRef<number>(0);

  async function load() {
    try {
      setLoading(true);
      const params: any = { limit: 300, offset: 0 };
      if (level) params.level = level;
      if (query.trim()) params.q = query.trim();
      if (path.trim()) params.path = path.trim();
      const { data } = await apiClient.get<LogListResponse>("/logs", { params });
      setItems(data.items);
    } catch {}
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  function handleScroll() {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    const delta = scrollTop - (lastTopRef.current || 0);
    lastTopRef.current = scrollTop;

    const nearBottom = scrollHeight - (scrollTop + clientHeight) < 120;
    const nearTop = scrollTop < 60;
    const chunk = 150;

    if (delta > 12 && nearBottom) {
      setVisible((v) => Math.min(items.length, v + chunk));
    } else if (delta < -12 && nearTop) {
      setVisible((v) => Math.max(chunk, v - chunk));
    }
  }

  const levels = useMemo(() => ["", "INFO", "WARNING", "ERROR"], []);

  return (
    <div className="space-y-6">
      <section className="p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold">Логи</h1>
            <p className="text-sm text-textMuted">Последние записи из журнала бота</p>
          </div>
          <div className="flex flex-wrap items-end gap-2">
            <label className="block">
              <span className="mb-1 block text-xs uppercase tracking-[0.28em] text-textMuted">Путь</span>
              <input className="w-72 rounded-2xl border border-outline/40 bg-background/80 px-3 py-2 text-sm" placeholder="logs/bot.log или /app/logs/bot.log" value={path} onChange={(e) => setPath(e.target.value)} />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs uppercase tracking-[0.28em] text-textMuted">Уровень</span>
              <select className="rounded-2xl border border-outline/40 bg-background/80 px-3 py-2 text-sm" value={level} onChange={(e) => setLevel(e.target.value)}>
                {levels.map((l) => (<option key={l} value={l}>{l || "ANY"}</option>))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs uppercase tracking-[0.28em] text-textMuted">Поиск</span>
              <input className="w-64 rounded-2xl border border-outline/40 bg-background/80 px-3 py-2 text-sm" placeholder="строка, логгер..." value={query} onChange={(e) => setQuery(e.target.value)} />
            </label>
            <button className="button-primary" onClick={load} disabled={loading}>{loading ? "Загрузка..." : "Обновить"}</button>
          </div>
        </div>

        <div ref={scrollRef} onScroll={handleScroll} className="mt-4 max-h-[70vh] overflow-auto rounded-2xl border border-outline/40">
          <div className="flex items-center justify-between border-b border-outline/40 bg-surfaceMuted/40 px-3 py-2 text-[11px] text-textMuted">
            <span>Показано {Math.min(visible, items.length)} из {items.length}</span>
            <button className="button-ghost" onClick={() => setVisible((v) => Math.min(items.length, v + 200))} disabled={visible >= items.length}>Показать ещё</button>
          </div>
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
              {items.slice(0, Math.min(visible, items.length)).map((it, idx) => (
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
      </section>
    </div>
  );
}


