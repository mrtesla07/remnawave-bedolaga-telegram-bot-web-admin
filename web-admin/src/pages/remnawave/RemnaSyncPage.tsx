import { useState } from "react";
import { apiClient } from "@/lib/api-client";

export default function RemnaSyncPage() {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function call(path: string, body?: any) {
    try {
      setBusy(true);
      setResult(null);
      const method = body ? apiClient.post : apiClient.get;
      const { data } = await method(path, body);
      setResult(JSON.stringify(data, null, 2));
    } catch (e: any) {
      setResult(e?.response?.data?.detail || "Ошибка запроса");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="p-6">
        <h1 className="text-xl font-semibold">RemnaWave · Синхронизация</h1>
        <p className="text-sm text-textMuted">Сервисные операции синхронизации пользователей и подписок</p>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          <button className="button-primary" disabled={busy} onClick={() => call("/remnawave/sync/from-panel", { mode: "all" })}>Из панели → в бота</button>
          <button className="button-primary" disabled={busy} onClick={() => call("/remnawave/sync/to-panel")}>Из бота → в панель</button>
          <button className="button-primary" disabled={busy} onClick={() => call("/remnawave/sync/subscriptions/validate")}>Проверить подписки</button>
          <button className="button-primary" disabled={busy} onClick={() => call("/remnawave/sync/subscriptions/cleanup")}>Очистить осиротевшие</button>
          <button className="button-primary" disabled={busy} onClick={() => call("/remnawave/sync/subscriptions/statuses")}>Синхронизировать статусы</button>
          <button className="button-ghost" disabled={busy} onClick={() => call("/remnawave/sync/recommendations")}>Рекомендации</button>
        </div>

        <div className="mt-4">
          <p className="text-xs uppercase tracking-[0.28em] text-textMuted">Результат</p>
          <pre className="mt-2 max-h-[360px] overflow-auto rounded-2xl border border-outline/40 bg-surfaceMuted/40 p-3 text-xs text-slate-200 whitespace-pre-wrap">{result || "Нет данных"}</pre>
        </div>
      </section>
    </div>
  );
}


