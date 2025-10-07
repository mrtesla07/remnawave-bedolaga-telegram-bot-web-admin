import { useCallback, useMemo, useState, useEffect } from "react";
import { LifeBuoy, MessageSquare, AlertTriangle, CheckCircle2, Clock3, Lock, Unlock } from "lucide-react";
import { useTicketsList, useTicketDetails, useUpdateTicketPriority, useUpdateTicketStatus, useSetReplyBlock, useClearReplyBlock, useReplyToTicket } from "@/features/tickets/queries";
import clsx from "clsx";
import { useUserDetails } from "@/features/users/queries";
import type { TicketDto, TicketListQuery, TicketPriority, TicketStatus } from "@/features/tickets/api";
import { authStore } from "@/store/auth-store";
import { defaultApiBaseUrl } from "@/lib/config";

const PAGE_SIZE = 25;

export function TicketsPage() {
  const { data, params, setParams, isLoading, isFetching } = useTicketsList({ limit: PAGE_SIZE, offset: 0 });
  const items = data ?? [];
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const canPrev = (params.offset ?? 0) > 0;
  const canNext = items.length === (params.limit ?? PAGE_SIZE);

  const counts = useMemo(() => {
    const byStatus = items.reduce<Record<string, number>>((acc, t) => ({ ...acc, [t.status]: (acc[t.status] ?? 0) + 1 }), {});
    return byStatus;
  }, [items]);

  const onFiltersChange = useCallback((filters: Partial<TicketListQuery>) => {
    setParams((prev) => ({ ...prev, ...filters, offset: 0 }));
  }, [setParams]);

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surfaceMuted/80 text-primary"><LifeBuoy className="h-5 w-5" /></div>
          <div>
            <p className="text-xs uppercase tracking-[0.32em] text-textMuted/70">Поддержка</p>
            <h1 className="text-xl font-semibold text-white">Тикеты</h1>
          </div>
        </div>
      </header>

      <TicketsFilters onChange={onFiltersChange} />

      <TicketsKpi counts={counts} />

      <TicketsTable items={items} isLoading={isLoading || isFetching} onOpen={(id) => setSelectedId(id)} />

      <footer className="flex items-center justify-between rounded-2xl border border-outline/40 bg-surfaceMuted/40 px-4 py-3 text-sm text-textMuted">
        <span>{(params.offset ?? 0) + 1}–{(params.offset ?? 0) + items.length} </span>
        <div className="flex items-center gap-2">
          <button type="button" className="button-ghost" disabled={!canPrev} onClick={() => setParams((prev) => ({ ...prev, offset: Math.max((prev.offset ?? 0) - (prev.limit ?? PAGE_SIZE), 0) }))}>Назад</button>
          <button type="button" className="button-primary" disabled={!canNext} onClick={() => setParams((prev) => ({ ...prev, offset: (prev.offset ?? 0) + (prev.limit ?? PAGE_SIZE) }))}>Далее</button>
        </div>
      </footer>

      <TicketDrawer id={selectedId} onClose={() => setSelectedId(null)} />
    </div>
  );
}

function TicketsFilters({ onChange }: { onChange: (filters: Partial<TicketListQuery>) => void }) {
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [userId, setUserId] = useState("");
  return (
    <div className="grid gap-3 rounded-3xl border border-outline/40 bg-surfaceMuted/40 p-4 md:grid-cols-3 xl:grid-cols-6">
      <select className="rounded-2xl border border-outline/40 bg-surface/70 px-3 py-2 text-sm text-white focus:border-primary/70 focus:outline-none focus:ring-2 focus:ring-primary/30" value={status} onChange={(e) => { setStatus(e.target.value); onChange({ status: (e.target.value || undefined) as TicketStatus | undefined }); }}>
        <option value="">Все статусы</option>
        <option value="open">Открыт</option>
        <option value="answered">Отвечен</option>
        <option value="pending">В ожидании</option>
        <option value="closed">Закрыт</option>
      </select>
      <select className="rounded-2xl border border-outline/40 bg-surface/70 px-3 py-2 text-sm text-white focus:border-primary/70 focus:outline-none focus:ring-2 focus:ring-primary/30" value={priority} onChange={(e) => { setPriority(e.target.value); onChange({ priority: (e.target.value || undefined) as TicketPriority | undefined }); }}>
        <option value="">Все приоритеты</option>
        <option value="low">Низкий</option>
        <option value="normal">Обычный</option>
        <option value="high">Высокий</option>
        <option value="urgent">Срочный</option>
      </select>
      <input className="rounded-2xl border border-outline/40 bg-surface/60 px-3 py-2 text-sm text-white placeholder:text-textMuted focus:border-primary/70 focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="ID пользователя" value={userId} onChange={(e) => { const v = e.target.value.replace(/[^0-9]/g, ""); setUserId(v); onChange({ user_id: v ? Number(v) : undefined }); }} />
    </div>
  );
}

function TicketsKpi({ counts }: { counts: Record<string, number> }) {
  const items = [
    { label: "Открыто", value: counts.open ?? 0, icon: <MessageSquare className="h-4 w-4 text-primary" /> },
    { label: "Отвечены", value: counts.answered ?? 0, icon: <CheckCircle2 className="h-4 w-4 text-success" /> },
    { label: "В ожидании", value: counts.pending ?? 0, icon: <Clock3 className="h-4 w-4 text-warning" /> },
    { label: "Закрыты", value: counts.closed ?? 0, icon: <AlertTriangle className="h-4 w-4 text-danger" /> },
  ];
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((kpi) => (
        <div key={kpi.label} className="flex items-center gap-3 rounded-2xl border border-outline/40 bg-surfaceMuted/40 p-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface/60">{kpi.icon}</span>
          <div>
            <p className="text-[10px] uppercase tracking-[0.28em] text-textMuted/70">{kpi.label}</p>
            <p className="text-sm font-semibold text-white">{kpi.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function TicketsTable({ items, isLoading, onOpen }: { items: TicketDto[]; isLoading?: boolean; onOpen: (id: number) => void }) {
  if (isLoading) {
    return <div className="rounded-3xl border border-outline/40 bg-surface/60 p-8 text-center text-textMuted">Загрузка тикетов…</div>;
  }
  if (!items.length) {
    return <div className="rounded-3xl border border-outline/40 bg-surface/60 p-8 text-center text-textMuted">Тикеты не найдены.</div>;
  }
  return (
    <div className="overflow-hidden rounded-3xl border border-outline/40">
      <table className="min-w-full divide-y divide-outline/40 bg-surface/80 text-sm">
        <thead className="bg-surfaceMuted/40 text-xs uppercase tracking-[0.28em] text-textMuted">
          <tr>
            <th className="px-4 py-3 text-left">ID</th>
            <th className="px-4 py-3 text-left">Пользователь</th>
            <th className="px-4 py-3 text-left">Заголовок</th>
            <th className="px-4 py-3 text-left">Статус</th>
            <th className="px-4 py-3 text-left">Приоритет</th>
            <th className="px-4 py-3 text-left">Создан</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-outline/40">
          {items.map((t) => (
            <tr key={t.id} className="bg-surface/60 hover:bg-surface/70 cursor-pointer" onClick={() => onOpen(t.id)}>
              <td className="px-4 py-3 font-medium text-slate-100">{t.id}</td>
              <td className="px-4 py-3 text-textMuted"><UserCell userId={t.user_id} /></td>
              <td className="px-4 py-3 text-slate-100">{t.title}</td>
              <td className="px-4 py-3 text-textMuted">{t.status}</td>
              <td className="px-4 py-3 text-textMuted">{t.priority}</td>
              <td className="px-4 py-3 text-textMuted">{new Date(t.created_at).toLocaleString("ru-RU")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function UserCell({ userId }: { userId: number }) {
  const { data, isLoading, isError } = useUserDetails(userId);
  if (isLoading) return <span className="text-textMuted">ID: {userId}</span>;
  if (isError || !data) return <span className="text-textMuted">ID: {userId}</span>;
  const username = data.username ? `@${data.username}` : `ID: ${userId}`;
  return <span className="text-slate-100">{username} <span className="text-textMuted">(tg: {data.telegram_id})</span></span>;
}

function TicketDrawer({ id, onClose }: { id: number | null; onClose: () => void }) {
  const { data } = useTicketDetails(id);
  const statusMutation = useUpdateTicketStatus();
  const priorityMutation = useUpdateTicketPriority();
  const setBlockMutation = useSetReplyBlock();
  const clearBlockMutation = useClearReplyBlock();
  const replyMutation = useReplyToTicket();
  const userInfo = useUserDetails(data?.user_id ?? null);

  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (id) setVisible(true);
  }, [id]);
  const requestClose = () => {
    setVisible(false);
    window.setTimeout(onClose, 200);
  };

  // Image viewer (lightbox) state
  const [viewerSrc, setViewerSrc] = useState<string | null>(null);
  const [viewerCaption, setViewerCaption] = useState<string | null>(null);
  useEffect(() => {
    if (!viewerSrc) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setViewerSrc(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewerSrc]);

  if (!id) return null;
  if (!data) return null;

  const ticket = data;

  const updateStatus = (status: TicketStatus) => statusMutation.mutate({ id: ticket.id, status });
  const updatePriority = (priority: TicketPriority) => priorityMutation.mutate({ id: ticket.id, priority });
  const toggleBlock = () => {
    if (ticket.user_reply_block_permanent || ticket.user_reply_block_until) {
      clearBlockMutation.mutate(ticket.id);
    } else {
      setBlockMutation.mutate({ id: ticket.id, permanent: true });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className={clsx("absolute inset-0 bg-black/60 transition-opacity duration-200", visible ? "opacity-100" : "opacity-0")}
        onClick={requestClose}
      />
      <div
        className={clsx(
          "relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-outline/50 bg-surface/90 p-6 sm:p-8 shadow-card transition-all duration-200",
          visible ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 -translate-y-2",
        )}
      >
        <header className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.32em] text-textMuted/70">Тикет #{ticket.id}</p>
            <h2 className="mt-1 text-xl font-semibold text-white">{ticket.title}</h2>
          </div>
          <div className="flex items-center gap-2">
            <button className="rounded-xl border border-outline/40 bg-surface/60 px-3 py-1 text-xs text-textMuted hover:text-white" onClick={() => updateStatus("open")}>Открыт</button>
            <button className="rounded-xl border border-outline/40 bg-surface/60 px-3 py-1 text-xs text-textMuted hover:text-white" onClick={() => updateStatus("answered")}>Отвечен</button>
            <button className="rounded-xl border border-outline/40 bg-surface/60 px-3 py-1 text-xs text-textMuted hover:text-white" onClick={() => updateStatus("pending")}>В ожидании</button>
            <button className="rounded-xl border border-outline/40 bg-danger/10 px-3 py-1 text-xs text-danger hover:bg-danger/20" onClick={() => updateStatus("closed")}>Закрыт</button>
          </div>
        </header>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-outline/40 bg-surfaceMuted/40 p-4">
            <p className="text-xs uppercase tracking-[0.28em] text-textMuted">Пользователь</p>
            <p className="mt-1 text-sm text-slate-100">
              {userInfo.data ? (
                <>
                  {userInfo.data.username ? `@${userInfo.data.username}` : `ID: ${userInfo.data.id}`} <span className="text-textMuted">(tg: {userInfo.data.telegram_id})</span>
                </>
              ) : (
                `ID: ${ticket.user_id}`
              )}
            </p>
          </div>
          <div className="rounded-2xl border border-outline/40 bg-surfaceMuted/40 p-4">
            <p className="text-xs uppercase tracking-[0.28em] text-textMuted">Приоритет</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {["low", "normal", "high", "urgent"].map((p) => (
                <button key={p} className="rounded-xl border border-outline/40 bg-surface/60 px-3 py-1 text-xs text-textMuted hover:text-white" onClick={() => updatePriority(p)}>{p}</button>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-outline/40 bg-surfaceMuted/40 p-4">
            <p className="text-xs uppercase tracking-[0.28em] text-textMuted">Ответы пользователя</p>
            <button className="mt-2 inline-flex items-center gap-2 rounded-xl border border-outline/40 bg-surface/60 px-3 py-1 text-xs text-textMuted hover:text-white" onClick={toggleBlock}>
              {ticket.user_reply_block_permanent || ticket.user_reply_block_until ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
              {ticket.user_reply_block_permanent || ticket.user_reply_block_until ? "Снять блокировку" : "Заблокировать"}
            </button>
          </div>
        </div>

        <section className="mt-4 space-y-2 overflow-y-auto pr-2">
          <h3 className="text-sm font-semibold text-white">Диалог</h3>
          <div className="space-y-2">
            {(ticket.messages ?? []).map((m) => (
              <div key={m.id} className="rounded-2xl border border-outline/40 bg-surface/60 p-3 text-sm text-slate-100">
                <p className="text-xs text-textMuted">{new Date(m.created_at).toLocaleString("ru-RU")} · {m.is_from_admin ? "Админ" : `Пользователь #${m.user_id}`}</p>
                {m.has_media && m.media_type === "photo" && m.media_type ? (
                  <div className="mt-2">
                    {(() => {
                      const { token, apiBaseUrl } = authStore.getState();
                      const base = String(apiBaseUrl || defaultApiBaseUrl || "").replace(/\/+$/, "");
                      const href = (m.media_url && m.media_url) || `${base}/tickets/${ticket.id}/messages/${m.id}/media${token ? `?api_key=${encodeURIComponent(token)}` : ""}`;
                      return (
                        <button
                          type="button"
                          onClick={() => { setViewerSrc(href); setViewerCaption(m.media_caption || "photo"); }}
                          className="group"
                        >
                          <img
                            src={href}
                            alt={m.media_caption || "photo"}
                            className="max-h-64 w-auto cursor-zoom-in rounded-xl border border-outline/40 object-contain transition-opacity group-hover:opacity-95"
                          />
                        </button>
                      );
                    })()}
                    {m.media_caption ? <p className="mt-1 text-xs text-textMuted">{m.media_caption}</p> : null}
                  </div>
                ) : null}
                {m.message_text ? <p className="mt-1 whitespace-pre-wrap">{m.message_text}</p> : null}
              </div>
            ))}
          </div>
          <form
            className="mt-3 flex items-center gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              const form = e.currentTarget as HTMLFormElement;
              const input = form.elements.namedItem("reply") as HTMLInputElement;
              const text = input.value.trim();
              if (!text) return;
              replyMutation.mutate({ id: ticket.id, message: { message_text: text } }, { onSuccess: () => { input.value = ""; } });
            }}
          >
            <input name="reply" className="flex-1 rounded-2xl border border-outline/40 bg-surface/60 px-3 py-2 text-sm text-white placeholder:text-textMuted focus:border-primary/70 focus:outline-none focus:ring-2 focus:ring-primary/40" placeholder="Ваш ответ" />
            <button type="submit" className="button-primary">Отправить</button>
          </form>
        </section>
        <button className="absolute right-6 top-6 rounded-full bg-surfaceMuted/60 p-2 text-textMuted hover:text-slate-100" onClick={requestClose} aria-label="Закрыть" />
      </div>
      {viewerSrc ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/80" onClick={() => setViewerSrc(null)} />
          <div className="relative max-h-[90vh] max-w-[95vw] p-2">
            <img
              src={viewerSrc}
              alt={viewerCaption || "photo"}
              className="max-h-[90vh] max-w-[95vw] rounded-xl border border-outline/40 object-contain shadow-2xl"
            />
            {viewerCaption ? <div className="mt-2 text-center text-xs text-textMuted">{viewerCaption}</div> : null}
            <button
              className="absolute right-2 top-2 rounded-full bg-surfaceMuted/60 p-2 text-textMuted hover:text-slate-100"
              onClick={() => setViewerSrc(null)}
              aria-label="Закрыть просмотр"
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}


