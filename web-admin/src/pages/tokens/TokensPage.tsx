import { useState } from "react";
import { useActivateToken, useCreateToken, useDeleteToken, useRevokeToken, useTokens } from "@/features/tokens/queries";
import { KeyRound, Plus, ShieldCheck, Trash2 } from "lucide-react";

export function TokensPage() {
  const tokensQuery = useTokens();
  const createMut = useCreateToken();
  const revokeMut = useRevokeToken();
  const activateMut = useActivateToken();
  const deleteMut = useDeleteToken();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  return (
    <section className="space-y-6">
      <header className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surfaceMuted/80 text-primary">
          <KeyRound className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.32em] text-textMuted/70">Безопасность</p>
          <h1 className="text-xl font-semibold text-white">API ключи</h1>
        </div>
      </header>

      <div className="rounded-2xl border border-outline/40 bg-surfaceMuted/40 p-4">
        <h2 className="text-sm font-semibold text-white/80">Создать ключ</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_2fr_auto]">
          <input className="rounded-xl border border-outline/40 bg-background/70 px-3 py-2 text-sm text-slate-100" placeholder="Название" value={name} onChange={(e) => setName(e.target.value)} />
          <input className="rounded-xl border border-outline/40 bg-background/70 px-3 py-2 text-sm text-slate-100" placeholder="Описание (необязательно)" value={description} onChange={(e) => setDescription(e.target.value)} />
          <button className="inline-flex items-center gap-2 rounded-xl bg-primary/20 px-3 py-2 text-sm font-semibold text-primary hover:bg-primary/30" onClick={() => name && createMut.mutate({ name, description })}>
            <Plus className="h-4 w-4" /> Создать
          </button>
        </div>
        {createMut.data?.token ? (
          <p className="mt-3 text-sm text-textMuted">Новый токен: <span className="font-mono text-white">{createMut.data.token}</span></p>
        ) : null}
      </div>

      <div className="rounded-2xl border border-outline/40 bg-surfaceMuted/40">
        <table className="w-full table-auto text-left text-sm">
          <thead>
            <tr className="text-textMuted">
              <th className="px-4 py-3">Название</th>
              <th className="px-4 py-3">Префикс</th>
              <th className="px-4 py-3">Статус</th>
              <th className="px-4 py-3">Создан</th>
              <th className="px-4 py-3">Действия</th>
            </tr>
          </thead>
          <tbody>
            {(tokensQuery.data || []).map((t) => (
              <tr key={t.id} className="border-t border-outline/30">
                <td className="px-4 py-3 text-slate-100">{t.name}</td>
                <td className="px-4 py-3 font-mono text-slate-100">{t.prefix}</td>
                <td className="px-4 py-3">
                  {t.is_active ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-success">
                      <ShieldCheck className="h-3 w-3" /> Активен
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-surface/60 px-2 py-0.5 text-[11px] uppercase tracking-wide text-textMuted">Отключен</span>
                  )}
                </td>
                <td className="px-4 py-3 text-textMuted">{new Date(t.created_at).toLocaleString("ru-RU")}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    {t.is_active ? (
                      <button className="rounded-lg bg-surface/60 px-2 py-1 text-xs text-textMuted hover:text-slate-100" onClick={() => revokeMut.mutate(t.id)}>Отключить</button>
                    ) : (
                      <button className="rounded-lg bg-surface/60 px-2 py-1 text-xs text-textMuted hover:text-slate-100" onClick={() => activateMut.mutate(t.id)}>Включить</button>
                    )}
                    <button className="inline-flex items-center gap-1 rounded-lg bg-danger/20 px-2 py-1 text-xs text-danger hover:bg-danger/30" onClick={() => deleteMut.mutate(t.id)}>
                      <Trash2 className="h-3 w-3" /> Удалить
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}


