import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Edit3, Gift, ListFilter, Plus, RefreshCw, Save, X } from "lucide-react";
import { useActivatePromoOffer, useBulkSendPromoOffers, useClearPromoOfferLogs, useCreatePromoOffer, useCreatePromoOfferTemplate, useDeletePromoOffer, useDeletePromoOfferTemplate, usePromoOfferDetails, usePromoOfferLogs, usePromoOfferTemplates, usePromoOffersList, useUpdatePromoOfferTemplate } from "@/features/promo-offers/queries";
import { fetchPromoOfferLogs, fetchRemnaWaveSquads } from "@/features/promo-offers/api";
import { apiClient } from "@/lib/api-client";
import type { PromoOfferCreateInput } from "@/features/promo-offers/api";

const PAGE_SIZE = 25;

export default function PromoOffersPage() {
  const { data, params, setParams, isLoading, isFetching } = usePromoOffersList({ limit: PAGE_SIZE, offset: 0, is_active: true });
  const { data: logs, params: logParams, setParams: setLogParams, isLoading: logsLoading, isFetching: logsFetching } = usePromoOfferLogs({ limit: PAGE_SIZE, offset: 0 });
  const clearLogs = useClearPromoOfferLogs();
  const { data: templates } = usePromoOfferTemplates();
  const createTemplate = useCreatePromoOfferTemplate();
  const updateTemplate = useUpdatePromoOfferTemplate();
  const deleteTemplate = useDeletePromoOfferTemplate();
  const bulkSend = useBulkSendPromoOffers();
  const createMutation = useCreatePromoOffer();
  const deleteMutation = useDeletePromoOffer();
  const activateMutation = useActivatePromoOffer();
  const [selectedOfferId, setSelectedOfferId] = useState<number | null>(null);
  const offerDetails = usePromoOfferDetails(selectedOfferId);

  const canPrev = (params.offset ?? 0) > 0;
  const canNext = data ? (params.offset ?? 0) + (params.limit ?? PAGE_SIZE) < data.total : false;
  const meta = useMemo(() => {
    if (!data) return "";
    const start = (data.offset ?? 0) + 1;
    const end = Math.min((data.offset ?? 0) + (data.limit ?? PAGE_SIZE), data.total);
    return `${start}–${end} из ${data.total}`;
  }, [data]);

  const [isFormOpen, setFormOpen] = useState(false);
  const [createDefaults, setCreateDefaults] = useState<{ templateId?: number; notificationType?: string; validHours?: number; discountPercent?: number; bonusRubles?: number } | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<any | null>(null);
  const [isTemplateDialogOpen, setTemplateDialogOpen] = useState(false);

  return (
    <div className="space-y-6">
      {/* Global listener for activate action */}
      {(() => {
        const handler = (e: any) => {
          if (e?.detail?.id) {
            activateMutation.mutate(e.detail.id);
          }
        };
        if (typeof window !== "undefined") {
          const target = (document.getElementById("root") || document.body);
          target.addEventListener("promo-activate", handler as any);
          // cleanup on hot reload
          // @ts-ignore
          (window as any).__promoActivateCleanup = () => target.removeEventListener("promo-activate", handler as any);
        }
        return null;
      })()}
      <section className="rounded-3xl border border-outline/40 bg-surface/60 p-4">
        <div className="grid gap-3 md:grid-cols-4">
          <label className="flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-[0.28em] text-textMuted">ID пользователя</span>
            <input
              className="rounded-2xl border border-outline/40 bg-surface/60 px-3 py-2 text-sm text-white placeholder:text-textMuted focus:border-primary/70 focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="Внутренний ID или Telegram ID"
              inputMode="numeric"
              onChange={(e) => {
                const v = e.target.value.replace(/[^0-9]/g, "");
                setParams((p:any) => ({ ...p, user_id: v ? Number(v) : undefined, offset: 0 }));
              }}
            />
            <span className="text-[11px] text-textMuted">Можно указать внутренний ID пользователя или его Telegram ID</span>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-[0.28em] text-textMuted">Тип уведомления</span>
            <select
              className="rounded-2xl border border-outline/40 bg-surface/70 px-3 py-2 text-sm text-white focus:border-primary/70 focus:outline-none focus:ring-2 focus:ring-primary/40"
              onChange={(e) => {
                const v = e.target.value;
                setParams((p:any) => ({ ...p, notification_type: v || undefined, offset: 0 }));
              }}
            >
              <option value="">Любой</option>
              <option value="custom">Промо (custom)</option>
              <option value="subscription_renewal">Продление подписки</option>
              <option value="promo_template">Промо по шаблону</option>
            </select>
            <span className="text-[11px] text-textMuted">Определяет сценарий предложения</span>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-[0.28em] text-textMuted">Статус предложения</span>
            <select
              className="rounded-2xl border border-outline/40 bg-surface/70 px-3 py-2 text-sm text-white focus:border-primary/70 focus:outline-none focus:ring-2 focus:ring-primary/40"
              value={
                params.is_active === undefined
                  ? ""
                  : (params.is_active ? "active" : "inactive")
              }
              onChange={(e) => {
                const v = e.target.value;
                setParams((p:any) => ({ ...p, is_active: v === "" ? undefined : v === "active", offset: 0 }));
              }}
            >
              <option value="">Все</option>
              <option value="active">Активные</option>
              <option value="inactive">Выключенные</option>
            </select>
            <span className="text-[11px] text-textMuted">Фильтрация по активности</span>
          </label>
        </div>
      </section>
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Персональные предложения</h1>
          <p className="text-sm text-textMuted">Создание и управление промо-предложениями, шаблонами и логами событий.</p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" className="button-ghost inline-flex items-center gap-2" onClick={() => setParams((p) => ({ ...p }))}>
            <RefreshCw className="h-4 w-4" /> Обновить
          </button>
          <button type="button" className="inline-flex items-center gap-2 rounded-xl bg-primary/20 px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/30" onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4" /> Новое предложение
          </button>
          <BulkSendButton templates={templates ?? []} onSend={(payload) => bulkSend.mutateAsync(payload)} isSending={bulkSend.isPending} />
        </div>
      </div>

      <OffersTable
        items={data?.items ?? []}
        isLoading={isLoading || isFetching}
        onFilter={(q) => setParams((p) => ({ ...p, ...q, offset: 0 }))}
        onDelete={(id) => deleteMutation.mutate(id)}
        onOpen={(id) => setSelectedOfferId(id)}
      />

      

      {isFormOpen ? (
        <CreateOfferDialog
          templates={templates ?? []}
          onClose={() => setFormOpen(false)}
          onCreate={(input) => createMutation.mutateAsync(input).then(() => setFormOpen(false))}
          isSubmitting={createMutation.isPending}
          initialTemplateId={createDefaults?.templateId}
          initialNotificationType={createDefaults?.notificationType}
          initialValidHours={createDefaults?.validHours}
          initialDiscountPercent={createDefaults?.discountPercent}
          initialBonusRubles={createDefaults?.bonusRubles}
        />
      ) : null}

      <section className="space-y-4">
        <header className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Шаблоны</h2>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl bg-primary/20 px-3 py-2 text-sm font-semibold text-primary hover:bg-primary/30"
            onClick={() => {
              setEditingTemplate(null);
              setTemplateDialogOpen(true);
            }}
          >
            <Plus className="h-4 w-4" /> Новый шаблон
          </button>
        </header>
        <div className="overflow-hidden rounded-3xl border border-outline/40">
          <table className="min-w-full divide-y divide-outline/40 bg-surface/80 text-sm">
            <thead className="bg-surfaceMuted/40 text-xs uppercase tracking-[0.28em] text-textMuted">
              <tr>
                <th className="px-4 py-3 text-left">Название</th>
                <th className="px-4 py-3 text-left">Тип</th>
                <th className="px-4 py-3 text-left">Срок</th>
                <th className="px-4 py-3 text-left">Скидка</th>
                <th className="px-4 py-3 text-left">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline/40">
              {(templates ?? []).map((t: any) => (
                <tr key={t.id} className="bg-surface/60">
                  <td className="px-4 py-3 font-medium text-white">{t.name}</td>
                  <td className="px-4 py-3 text-textMuted">{ruTypeLabel(t.offer_type)}</td>
                  <td className="px-4 py-3 text-textMuted">{t.valid_hours} ч</td>
                  <td className="px-4 py-3 text-textMuted">{t.discount_percent}%</td>
                  <td className="px-4 py-3">
                    <button
                      className="rounded-xl border border-outline/40 bg-surface/60 px-3 py-1 text-xs text-textMuted hover:text-white"
                      onClick={() => {
                        setEditingTemplate(t);
                        setTemplateDialogOpen(true);
                      }}
                    >
                      <Edit3 className="mr-1 inline h-3.5 w-3.5" /> Редактировать
                    </button>
                    <button
                      className="ml-2 rounded-xl border border-outline/40 bg-primary/15 px-3 py-1 text-xs text-primary hover:bg-primary/25"
                      onClick={() => {
                        // Предпросмотр: открываем диалог с полями (без сохранения)
                        setEditingTemplate(t);
                        setTemplateDialogOpen(true);
                      }}
                    >
                      Просмотр
                    </button>
                    <button
                      className="ml-2 rounded-xl border border-outline/40 bg-danger/10 px-3 py-1 text-xs text-danger hover:bg-danger/20"
                      onClick={() => {
                        if (window.confirm("Удалить шаблон?")) {
                          deleteTemplate.mutate(t.id);
                        }
                      }}
                    >
                      Удалить
                    </button>
                    <button
                      className="ml-2 rounded-xl border border-outline/40 bg-success/15 px-3 py-1 text-xs text-success hover:bg-success/25"
                      onClick={() => {
                        setCreateDefaults({
                          templateId: t.id,
                          notificationType: "promo_template",
                          validHours: t.valid_hours,
                          discountPercent: t.discount_percent,
                          bonusRubles: (t.bonus_amount_kopeks || 0) / 100,
                        });
                        setFormOpen(true);
                      }}
                    >
                      Отправить пользователю
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-4">
        <header className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Операции с предложениями</h2>
          <div className="flex flex-wrap items-center gap-2 text-xs text-textMuted">
            <ListFilter className="h-4 w-4" />
            <input className="rounded-xl border border-outline/40 bg-surface/60 px-3 py-1 text-sm text-white" placeholder="ID пользователя" value={String(logParams.user_id ?? "")} onChange={(e) => setLogParams((p:any) => ({ ...p, user_id: e.target.value ? Number(e.target.value) : undefined, offset: 0 }))} />
            <input className="rounded-xl border border-outline/40 bg-surface/60 px-3 py-1 text-sm text-white" placeholder="ID предложения" value={String(logParams.offer_id ?? "")} onChange={(e) => setLogParams((p:any) => ({ ...p, offer_id: e.target.value ? Number(e.target.value) : undefined, offset: 0 }))} />
            <select className="rounded-xl border border-outline/40 bg-surface/70 px-3 py-1 text-sm text-white" value={logParams.action ?? ""} onChange={(e) => setLogParams((p:any) => ({ ...p, action: e.target.value || undefined, offset: 0 }))}>
              <option value="">Любое действие</option>
              <option value="claimed">Активировано</option>
              <option value="enabled">Включено</option>
              <option value="disabled">Отключено</option>
            </select>
            <select className="rounded-xl border border-outline/40 bg-surface/70 px-3 py-1 text-sm text-white" value={logParams.source ?? ""} onChange={(e) => setLogParams((p:any) => ({ ...p, source: e.target.value || undefined, offset: 0 }))}>
              <option value="">Любой источник</option>
              <option value="promo_template">Промо по шаблону</option>
              <option value="subscription_renewal">Продление подписки</option>
              <option value="custom">Промо (custom)</option>
            </select>
            <button
              type="button"
              className="rounded-xl border border-outline/40 bg-surface/60 px-3 py-1 text-sm text-textMuted hover:text-white"
              onClick={() => setLogParams((p:any) => ({ ...p, offset: Math.max((p.offset ?? 0) - (p.limit ?? PAGE_SIZE), 0) }))}
              disabled={(logParams.offset ?? 0) === 0}
            >Назад</button>
            <button
              type="button"
              className="button-primary px-3 py-1"
              onClick={() => setLogParams((p:any) => ({ ...p, offset: (p.offset ?? 0) + (p.limit ?? PAGE_SIZE) }))}
              disabled={!logs || ((logParams.offset ?? 0) + (logParams.limit ?? PAGE_SIZE)) >= (logs.total ?? 0)}
            >Далее</button>
            <button
              type="button"
              className="rounded-xl border border-outline/40 bg-primary/20 px-3 py-1 text-sm font-semibold text-primary hover:bg-primary/30"
              onClick={async () => {
                const limit = 200;
                const rows: any[] = [];
                let offset = 0;
                while (true) {
                  const page = await fetchPromoOfferLogs({
                    limit,
                    offset,
                    user_id: logParams.user_id,
                    offer_id: logParams.offer_id,
                    action: logParams.action,
                    source: logParams.source,
                  });
                  rows.push(...(page.items || []));
                  offset += limit;
                  if (offset >= (page.total || rows.length)) break;
                }
                const header = ["id","user_id","offer_id","action","source","percent","effect_type","created_at"];
                const lines = [header.join(",")].concat(
                  rows.map((r:any) => [r.id, r.user_id ?? "", r.offer?.id ?? r.offer_id ?? "", r.action ?? "", r.source ?? "", r.percent ?? "", r.effect_type ?? "", r.created_at].map((x:any) => String(x).replace(/\n/g, " ")).join(","))
                );
                const blob = new Blob(["\ufeff" + lines.join("\n")], { type: "text/csv;charset=utf-8;" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "promo_offer_logs.csv";
                document.body.appendChild(a);
                a.click();
                a.remove();
                URL.revokeObjectURL(url);
              }}
            >Экспорт CSV</button>
            <button
              type="button"
              className="rounded-xl border border-outline/40 bg-danger/10 px-3 py-1 text-sm text-danger hover:bg-danger/20"
              onClick={() => {
                if (!window.confirm("Очистить операции по текущим фильтрам?")) return;
                clearLogs.mutate({
                  user_id: logParams.user_id,
                  offer_id: logParams.offer_id,
                  action: logParams.action,
                  source: logParams.source,
                });
              }}
            >Очистить</button>
          </div>
        </header>
        <LogsTable items={logs?.items ?? []} isLoading={logsLoading || logsFetching} />
      </section>

      {isTemplateDialogOpen ? (
        <TemplateFormDialog
          template={editingTemplate}
          onClose={() => setTemplateDialogOpen(false)}
          onCreate={async (payload) => {
            await createTemplate.mutateAsync(payload);
            setTemplateDialogOpen(false);
          }}
          onUpdate={async (id, payload) => {
            await updateTemplate.mutateAsync({ id, data: payload });
            setTemplateDialogOpen(false);
          }}
          isSubmitting={createTemplate.isPending || updateTemplate.isPending}
        />
      ) : null}

      {selectedOfferId ? (
        <OfferDetailsDrawer id={selectedOfferId} onClose={() => setSelectedOfferId(null)} />
      ) : null}
    </div>
  );
}

function OfferDetailsDrawer({ id, onClose }: { id: number; onClose: () => void }) {
  const details = usePromoOfferDetails(id);
  const o: any = details.data;
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
      <div className="h-full w-full max-w-xl overflow-y-auto border-l border-outline/40 bg-surface/95 p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Детали предложения</h3>
          <button className="rounded-full bg-surfaceMuted/60 p-2 text-textMuted hover:text-white" onClick={onClose}>×</button>
        </div>
        {details.isLoading ? (
          <div className="mt-6 text-textMuted">Загрузка…</div>
        ) : o ? (
          <div className="mt-4 space-y-3 text-sm">
            <div><span className="text-textMuted">ID:</span> <span className="text-white">{o.id}</span></div>
            <div><span className="text-textMuted">Пользователь:</span> <span className="text-white">{o.user?.username ? `@${o.user.username}` : `#${o.userId}`}</span></div>
            <div><span className="text-textMuted">Тип:</span> <span className="text-white">{o.notificationType}</span></div>
            <div><span className="text-textMuted">Скидка:</span> <span className="text-white">{o.discountPercent}%</span></div>
            <div><span className="text-textMuted">Бонус:</span> <span className="text-white">{(o.bonusRubles ?? 0).toFixed(2)} ₽</span></div>
            <div><span className="text-textMuted">Действует до:</span> <span className="text-white">{new Date(o.expiresAt).toLocaleString("ru-RU")}</span></div>
            <div><span className="text-textMuted">Статус:</span> <span className="text-white">{o.isActive ? "Активно" : "Выключено"}</span></div>
            <div><span className="text-textMuted">Эффект:</span> <span className="text-white">{o.effectType}</span></div>
          </div>
        ) : (
          <div className="mt-6 text-textMuted">Не найдено</div>
        )}
      </div>
    </div>
  );
}

function OffersTable({ items, isLoading, onFilter, onDelete, onOpen }: { items: any[]; isLoading?: boolean; onFilter: (q: Record<string, any>) => void; onDelete: (id: number) => void; onOpen: (id: number) => void }) {
  if (isLoading) return <div className="rounded-3xl border border-outline/40 bg-surface/60 p-8 text-center text-textMuted">Загрузка…</div>;
  if (!items.length) return <div className="rounded-3xl border border-outline/40 bg-surface/60 p-8 text-center text-textMuted">Предложения не найдены.</div>;
  return (
    <div className="overflow-hidden rounded-3xl border border-outline/40">
      <table className="min-w-full divide-y divide-outline/40 bg-surface/80 text-sm">
        <thead className="bg-surfaceMuted/40 text-xs uppercase tracking-[0.28em] text-textMuted">
          <tr>
            <th className="px-4 py-3 text-left">Пользователь</th>
            <th className="px-4 py-3 text-left">Тип</th>
            <th className="px-4 py-3 text-left">Скидка</th>
            <th className="px-4 py-3 text-left">Бонус</th>
            <th className="px-4 py-3 text-left">Срок</th>
            <th className="px-4 py-3 text-left">Статус</th>
            <th className="px-4 py-3 text-left">Действия</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-outline/40">
          {items.map((o) => (
            <tr key={o.id} className="bg-surface/60">
              <td className="px-4 py-3 font-medium text-white">{o.user?.username ? `@${o.user.username}` : `#${o.userId}`}</td>
              <td className="px-4 py-3">
                <span className="inline-flex items-center rounded-lg bg-surface/60 px-2 py-1 text-xs text-textMuted">
                  {o.notificationType?.startsWith("promo_template_") ? "Промо по шаблону" : (o.notificationType === "subscription_renewal" ? "Продление подписки" : o.notificationType || "—")}
                </span>
              </td>
              <td className="px-4 py-3">
                <span className="inline-flex items-center rounded-lg bg-success/15 px-2 py-1 text-xs text-success">{o.discountPercent}%</span>
              </td>
              <td className="px-4 py-3">
                <span className="inline-flex items-center rounded-lg bg-primary/15 px-2 py-1 text-xs text-primary">{(o.bonusRubles ?? 0).toFixed(2)} ₽</span>
              </td>
              <td className="px-4 py-3 text-textMuted">до {new Date(o.expiresAt).toLocaleString("ru-RU")}</td>
              <td className="px-4 py-3">
                <span className={`inline-flex items-center rounded-lg px-2 py-1 text-xs ${o.isActive ? "bg-primary/15 text-primary" : "bg-surface/60 text-textMuted"}`}>{o.isActive ? "Активно" : "Выключено"}</span>
              </td>
              <td className="px-4 py-3">
                {!o.isActive ? (
                  <button className="rounded-xl border border-outline/40 bg-success/15 px-3 py-1 text-xs text-success hover:bg-success/25" onClick={() => {
                    if (window.confirm("Включить предложение?")) {
                      // use a custom event to bubble to parent where activateMutation exists
                      const evt = new CustomEvent("promo-activate", { detail: { id: o.id }, bubbles: true });
                      (document.getElementById("root") || document.body).dispatchEvent(evt);
                    }
                  }}>
                    Включить
                  </button>
                ) : null}
                <button className="ml-2 rounded-xl border border-outline/40 bg-danger/10 px-3 py-1 text-xs text-danger hover:bg-danger/20" onClick={() => { if (window.confirm("Удалить предложение?")) onDelete(o.id); }}>
                  Удалить
                </button>
                <button className="ml-2 rounded-xl border border-outline/40 bg-surface/60 px-3 py-1 text-xs text-textMuted hover:text-white" onClick={() => onOpen(o.id)}>
                  Подробнее
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function LogsTable({ items, isLoading }: { items: any[]; isLoading?: boolean }) {
  if (isLoading) return <div className="rounded-3xl border border-outline/40 bg-surface/60 p-8 text-center text-textMuted">Загрузка…</div>;
  if (!items.length) return <div className="rounded-3xl border border-outline/40 bg-surface/60 p-8 text-center text-textMuted">Лог пуст.</div>;
  return (
    <div className="overflow-hidden rounded-3xl border border-outline/40">
      <table className="min-w-full divide-y divide-outline/40 bg-surface/80 text-sm">
        <thead className="bg-surfaceMuted/40 text-xs uppercase tracking-[0.28em] text-textMuted">
          <tr>
            <th className="px-4 py-3 text-left">Время</th>
            <th className="px-4 py-3 text-left">Пользователь</th>
            <th className="px-4 py-3 text-left">Действие</th>
            <th className="px-4 py-3 text-left">Источник</th>
            <th className="px-4 py-3 text-left">Эффект</th>
            <th className="px-4 py-3 text-left">Описание</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-outline/40">
          {items.map((e) => (
            <tr key={e.id} className="bg-surface/60">
              <td className="px-4 py-3 text-textMuted">{new Date(e.created_at).toLocaleString("ru-RU")}</td>
              <td className="px-4 py-3 text-textMuted">{e.user?.username ? `@${e.user.username}` : `#${e.user_id}`}</td>
              <td className="px-4 py-3 text-textMuted">{ruActionLabel(e.action)}</td>
              <td className="px-4 py-3 text-textMuted">{ruSourceLabel(e.source)}</td>
              <td className="px-4 py-3 text-textMuted">{ruEffectLabel(e.effect_type)}</td>
              <td className="px-4 py-3 text-textMuted">{buildLogDescription(e)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CreateOfferDialog({ templates, onClose, onCreate, isSubmitting, initialTemplateId, initialNotificationType, initialValidHours, initialDiscountPercent, initialBonusRubles }: { templates: any[]; onClose: () => void; onCreate: (input: PromoOfferCreateInput) => Promise<void>; isSubmitting: boolean; initialTemplateId?: number; initialNotificationType?: string; initialValidHours?: number; initialDiscountPercent?: number; initialBonusRubles?: number; }) {
  const [userId, setUserId] = useState("");
  const [templateId, setTemplateId] = useState<number | "">(initialTemplateId ?? templates[0]?.id ?? "");
  const [validHours, setValidHours] = useState(initialValidHours ?? 48);
  const [discountPercent, setDiscountPercent] = useState(initialDiscountPercent ?? 20);
  const [bonusRubles, setBonusRubles] = useState(initialBonusRubles ?? 0);
  const [notificationType, setNotificationType] = useState(initialNotificationType ?? "custom");
  const [sendNotification, setSendNotification] = useState<boolean>(true);
  const [buttonTextOverride, setButtonTextOverride] = useState<string>("");
  const [testSquads, setTestSquads] = useState<string>("");
  const [testDurationHours, setTestDurationHours] = useState<number | "">("");
  const [availableSquads, setAvailableSquads] = useState<any[]>([]);

  // lazy load squads on first focus
  const loadSquads = async () => {
    try {
      if (!availableSquads.length) {
        const items = await fetchRemnaWaveSquads();
        setAvailableSquads(items);
      }
    } catch {}
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    // Map UI russian-friendly selection to actual notification_type
    let finalNotification = notificationType;
    if (notificationType === "promo_template" && templateId) {
      finalNotification = `promo_template_${templateId}`;
    }

    const extraData: Record<string, any> = { template_id: templateId || undefined };
    if (buttonTextOverride.trim()) {
      extraData.button_text_override = buttonTextOverride.trim();
    }
    if (testSquads.trim()) {
      extraData.test_squad_uuids = testSquads.split(",").map(s => s.trim()).filter(Boolean);
    }
    if (testDurationHours !== "") {
      extraData.test_duration_hours = Math.max(1, Number(testDurationHours) || 1);
    }

    const payload: PromoOfferCreateInput = {
      user_id: userId ? Number(userId) : 0,
      notification_type: finalNotification,
      valid_hours: Number(validHours),
      discount_percent: Number(discountPercent),
      bonus_amount_kopeks: Math.round(Number(bonusRubles) * 100),
      effect_type: "percent_discount",
      extra_data: extraData,
      send_notification: sendNotification,
    };
    await onCreate(payload);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="relative w-full max-w-xl rounded-3xl border border-outline/40 bg-surface/95 p-8 shadow-card">
        <button className="absolute right-6 top-6 rounded-full bg-surfaceMuted/60 p-2 text-textMuted hover:text-white" onClick={onClose}>×</button>
        <header className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/20 text-primary">
            <Gift className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.32em] text-textMuted/70">Персональное предложение</p>
            <h2 className="text-xl font-semibold text-white">Новое предложение</h2>
          </div>
        </header>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-2">
              <span className="text-xs uppercase tracking-[0.28em] text-textMuted">ID пользователя</span>
              <input className="rounded-2xl border border-outline/40 bg-surface/60 px-3 py-2 text-sm text-white" inputMode="numeric" pattern="[0-9]*" value={userId} onChange={(e) => setUserId(e.target.value.replace(/[^0-9]/g, ""))} placeholder="Внутренний ID или Telegram ID" />
              <span className="text-[11px] text-textMuted">Укажите внутренний ID пользователя или его Telegram ID</span>
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-xs uppercase tracking-[0.28em] text-textMuted">Шаблон</span>
              <select className="rounded-2xl border border-outline/40 bg-surface/70 px-3 py-2 text-sm text-white" value={templateId} onChange={(e) => setTemplateId(e.target.value ? Number(e.target.value) : "") }>
                <option value="">Не использовать</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
              <span className="text-[11px] text-textMuted">Для типа “Промо по шаблону” выбор обязателен</span>
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-xs uppercase tracking-[0.28em] text-textMuted">Срок (часов)</span>
              <input className="rounded-2xl border border-outline/40 bg-surface/60 px-3 py-2 text-sm text-white" type="number" min={1} value={validHours} onChange={(e) => setValidHours(Number(e.target.value))} />
              <span className="text-[11px] text-textMuted">Время, в течение которого пользователь может активировать предложение</span>
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-xs uppercase tracking-[0.28em] text-textMuted">Скидка, %</span>
              <input className="rounded-2xl border border-outline/40 bg-surface/60 px-3 py-2 text-sm text-white" type="number" min={0} value={discountPercent} onChange={(e) => setDiscountPercent(Number(e.target.value))} />
              <span className="text-[11px] text-textMuted">Процент скидки, который применится при оплате</span>
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-xs uppercase tracking-[0.28em] text-textMuted">Бонус, ₽</span>
              <input className="rounded-2xl border border-outline/40 bg-surface/60 px-3 py-2 text-sm text-white" type="number" min={0} value={bonusRubles} onChange={(e) => setBonusRubles(Number(e.target.value))} />
              <span className="text-[11px] text-textMuted">Начисляется на баланс пользователя (0 — без бонуса)</span>
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-xs uppercase tracking-[0.28em] text-textMuted">Тип уведомления</span>
              <select className="rounded-2xl border border-outline/40 bg-surface/70 px-3 py-2 text-sm text-white" value={notificationType} onChange={(e) => setNotificationType(e.target.value)}>
                <option value="custom">Промо (custom)</option>
                <option value="subscription_renewal">Продление подписки</option>
                <option value="promo_template">Промо по шаблону</option>
              </select>
              <span className="text-[11px] text-textMuted">Определяет сценарий предложения и отображение для пользователя</span>
            </label>
          <label className="flex flex-col gap-2">
            <span className="text-xs uppercase tracking-[0.28em] text-textMuted">Текст кнопки (уведомление)</span>
            <input className="rounded-2xl border border-outline/40 bg-surface/60 px-3 py-2 text-sm text-white" value={buttonTextOverride} onChange={(e) => setButtonTextOverride(e.target.value)} placeholder="Например: Забрать скидку" />
            <span className="text-[11px] text-textMuted">Персонально переопределяет текст кнопки из шаблона</span>
          </label>
          <label className="md:col-span-2 flex flex-col gap-2">
            <span className="text-xs uppercase tracking-[0.28em] text-textMuted">UUID сквадов (для тест‑доступа, через запятую)</span>
            <input className="rounded-2xl border border-outline/40 bg-surface/60 px-3 py-2 text-sm text-white" value={testSquads} onFocus={loadSquads} onChange={(e) => setTestSquads(e.target.value)} placeholder="uuid1, uuid2" />
            {availableSquads.length ? (
              <div className="flex flex-wrap gap-1 pt-1">
                {availableSquads.slice(0, 12).map((s:any) => (
                  <button key={s.uuid} type="button" className="rounded-lg border border-outline/40 px-2 py-1 text-xs text-textMuted hover:text-white" onClick={() => setTestSquads(v => (v ? (v+", "+s.uuid) : s.uuid))}>
                    {s.name}
                  </button>
                ))}
              </div>
            ) : null}
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-xs uppercase tracking-[0.28em] text-textMuted">Длительность теста (ч) — переопределить</span>
            <input className="rounded-2xl border border-outline/40 bg-surface/60 px-3 py-2 text-sm text-white" type="number" min={1} value={testDurationHours as any} onChange={(e) => setTestDurationHours(e.target.value === "" ? "" : Math.max(1, Number(e.target.value) || 1))} placeholder="по шаблону" />
          </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={sendNotification} onChange={(e) => setSendNotification(e.target.checked)} />
              <span className="text-sm text-textMuted">Отправить уведомление</span>
            </label>
          </div>
          <footer className="flex items-center justify-end gap-3">
            <button type="button" className="button-ghost" onClick={onClose} disabled={isSubmitting}>Отмена</button>
            <button type="submit" className="button-primary" disabled={isSubmitting || !userId}>Создать</button>
          </footer>
        </form>
      </div>
    </div>
  );
}

function TemplateFormDialog({
  template,
  onClose,
  onCreate,
  onUpdate,
  isSubmitting,
}: {
  template: any | null;
  onClose: () => void;
  onCreate: (payload: any) => Promise<void>;
  onUpdate: (id: number, payload: any) => Promise<void>;
  isSubmitting: boolean;
}) {
  const isEdit = Boolean(template);
  const [name, setName] = useState(template?.name ?? "");
  const [offerType, setOfferType] = useState(template?.offer_type ?? "custom");
  const [messageText, setMessageText] = useState(template?.message_text ?? "");
  const [buttonText, setButtonText] = useState(template?.button_text ?? "");
  const [validHours, setValidHours] = useState<number>(template?.valid_hours ?? 24);
  const [discountPercent, setDiscountPercent] = useState<number>(template?.discount_percent ?? 0);
  const [bonusRubles, setBonusRubles] = useState<number>(((template?.bonus_amount_kopeks ?? 0) as number) / 100);
  const [activeDiscountHours, setActiveDiscountHours] = useState<number | "">(template?.active_discount_hours ?? "");
  const [testDurationHours, setTestDurationHours] = useState<number | "">(template?.test_duration_hours ?? "");
  const [testSquads, setTestSquads] = useState<string>((template?.test_squad_uuids ?? []).join(", "));
  const [isActive, setIsActive] = useState<boolean>(template?.is_active ?? true);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const basePayload: any = {
      name: name.trim(),
      offer_type: offerType.trim(),
      message_text: messageText,
      button_text: buttonText,
      valid_hours: Math.max(1, Number(validHours) || 24),
      discount_percent: Math.max(0, Number(discountPercent) || 0),
      bonus_amount_kopeks: Math.max(0, Math.round((Number(bonusRubles) || 0) * 100)),
      active_discount_hours: activeDiscountHours === "" ? null : Math.max(1, Number(activeDiscountHours) || 1),
      test_duration_hours: testDurationHours === "" ? null : Math.max(1, Number(testDurationHours) || 1),
      test_squad_uuids: testSquads
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      is_active: !!isActive,
    };

    if (isEdit) {
      await onUpdate(template.id, basePayload);
    } else {
      await onCreate(basePayload);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="relative w-full max-w-3xl rounded-3xl border border-outline/40 bg-surface/95 p-8 shadow-card">
        <button className="absolute right-6 top-6 rounded-full bg-surfaceMuted/60 p-2 text-textMuted hover:text-white" onClick={onClose}>
          <X className="h-4 w-4" />
        </button>
        <header className="mb-4 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/20 text-primary">
            <Gift className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.32em] text-textMuted/70">Шаблон промо‑предложения</p>
            <h2 className="text-xl font-semibold text-white">{isEdit ? "Редактирование" : "Новый шаблон"}</h2>
          </div>
        </header>
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-2">
              <span className="text-xs uppercase tracking-[0.28em] text-textMuted">Название</span>
              <input className="rounded-2xl border border-outline/40 bg-surface/60 px-3 py-2 text-sm text-white" value={name} onChange={(e) => setName(e.target.value)} required />
              <span className="text-[11px] text-textMuted">Название шаблона видно только администраторам</span>
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-xs uppercase tracking-[0.28em] text-textMuted">Тип</span>
              <select className="rounded-2xl border border-outline/40 bg-surface/70 px-3 py-2 text-sm text-white" value={offerType} onChange={(e) => setOfferType(e.target.value)}>
                <option value="custom">Промо</option>
                <option value="extend_discount">Скидка на продление</option>
                <option value="purchase_discount">Скидка на покупку</option>
                <option value="test_access">Тестовый доступ</option>
              </select>
              <span className="text-[11px] text-textMuted">Определяет тип действия (скидка, покупка, триал‑доступ)</span>
            </label>
            <label className="md:col-span-2 flex flex-col gap-2">
              <span className="text-xs uppercase tracking-[0.28em] text-textMuted">Текст сообщения</span>
              <textarea rows={5} className="rounded-2xl border border-outline/40 bg-surface/60 px-3 py-2 text-sm text-white" value={messageText} onChange={(e) => setMessageText(e.target.value)} />
              <span className="text-[11px] text-textMuted">Текст для пользователя; поддерживаются HTML‑теги</span>
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-xs uppercase tracking-[0.28em] text-textMuted">Текст кнопки</span>
              <input className="rounded-2xl border border-outline/40 bg-surface/60 px-3 py-2 text-sm text-white" value={buttonText} onChange={(e) => setButtonText(e.target.value)} />
              <span className="text-[11px] text-textMuted">Например: “Забрать скидку” или “Подключить доступ”</span>
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-xs uppercase tracking-[0.28em] text-textMuted">Срок действия (ч)</span>
              <input type="number" min={1} className="rounded-2xl border border-outline/40 bg-surface/60 px-3 py-2 text-sm text-white" value={validHours} onChange={(e) => setValidHours(Number(e.target.value))} />
              <span className="text-[11px] text-textMuted">Сколько часов предложение доступно для активации</span>
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-xs uppercase tracking-[0.28em] text-textMuted">Скидка, %</span>
              <input type="number" min={0} className="rounded-2xl border border-outline/40 bg-surface/60 px-3 py-2 text-sm text-white" value={discountPercent} onChange={(e) => setDiscountPercent(Number(e.target.value))} />
              <span className="text-[11px] text-textMuted">Процент скидки, применяемый при оплате</span>
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-xs uppercase tracking-[0.28em] text-textMuted">Бонус, ₽</span>
              <input type="number" min={0} className="rounded-2xl border border-outline/40 bg-surface/60 px-3 py-2 text-sm text-white" value={bonusRubles} onChange={(e) => setBonusRubles(Number(e.target.value))} />
              <span className="text-[11px] text-textMuted">Начисляется на баланс при активации (0 — не начислять)</span>
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-xs uppercase tracking-[0.28em] text-textMuted">Активная скидка (ч)</span>
              <input type="number" min={1} className="rounded-2xl border border-outline/40 bg-surface/60 px-3 py-2 text-sm text-white" value={activeDiscountHours as any} onChange={(e) => setActiveDiscountHours(e.target.value === "" ? "" : Number(e.target.value))} placeholder="пусто = не используется" />
              <span className="text-[11px] text-textMuted">Сколько часов действует скидка после активации</span>
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-xs uppercase tracking-[0.28em] text-textMuted">Длительность теста (ч)</span>
              <input type="number" min={1} className="rounded-2xl border border-outline/40 bg-surface/60 px-3 py-2 text-sm text-white" value={testDurationHours as any} onChange={(e) => setTestDurationHours(e.target.value === "" ? "" : Number(e.target.value))} placeholder="пусто = не используется" />
              <span className="text-[11px] text-textMuted">Для тест‑доступа: время подключения к серверам</span>
            </label>
            <label className="md:col-span-2 flex flex-col gap-2">
              <span className="text-xs uppercase tracking-[0.28em] text-textMuted">UUID отрядов (через запятую)</span>
              <input className="rounded-2xl border border-outline/40 bg-surface/60 px-3 py-2 text-sm text-white" value={testSquads} onChange={(e) => setTestSquads(e.target.value)} placeholder="uuid1, uuid2" />
              <span className="text-[11px] text-textMuted">Список UUID из RemnaWave; пусто — использовать значения по умолчанию</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
              <span className="text-sm text-textMuted">Активен</span>
              <span className="text-[11px] text-textMuted">Можно временно выключить шаблон без удаления</span>
            </label>
          </div>
          <footer className="flex items-center justify-end gap-3">
            <button type="button" className="button-ghost inline-flex items-center gap-2" onClick={onClose} disabled={isSubmitting}><X className="h-4 w-4" /> Отмена</button>
            <button type="submit" className="button-primary inline-flex items-center gap-2" disabled={isSubmitting}><Save className="h-4 w-4" /> {isEdit ? "Сохранить" : "Создать"}</button>
          </footer>
        </form>
      </div>
    </div>
  );
}

function BulkSendButton({ templates, onSend, isSending }: { templates: any[]; onSend: (payload: any) => Promise<any>; isSending: boolean }) {
  const [open, setOpen] = useState(false);
  const [templateId, setTemplateId] = useState<number | "">(templates[0]?.id ?? "");
  const [segment, setSegment] = useState<string>("trial_active");
  const [limit, setLimit] = useState<number>(200);
  const [discountPercent, setDiscountPercent] = useState<number | "">("");
  const [validHours, setValidHours] = useState<number | "">("");
  const [sendNotification, setSendNotification] = useState<boolean>(true);
  const [testSquads, setTestSquads] = useState<string>("");
  const [testDurationHours, setTestDurationHours] = useState<number | "">("");
  const [mediaType, setMediaType] = useState<string>("");
  const [mediaFileId, setMediaFileId] = useState<string>("");
  const [mediaUploadError, setMediaUploadError] = useState<string>("");
  const [availableSquads, setAvailableSquads] = useState<any[]>([]);

  const loadSquads = async () => {
    try {
      if (!availableSquads.length) {
        const items = await fetchRemnaWaveSquads();
        setAvailableSquads(items);
      }
    } catch {}
  };

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);

  return (
    <>
      <button
        type="button"
        className="inline-flex items-center gap-2 rounded-xl bg-success/20 px-4 py-2 text-sm font-semibold text-success hover:bg-success/30"
        onClick={() => setOpen(true)}
      >
        Массовая отправка
      </button>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="relative w-full max-w-xl rounded-3xl border border-outline/40 bg-surface/95 p-8 shadow-card">
            <button className="absolute right-6 top-6 rounded-full bg-surfaceMuted/60 p-2 text-textMuted hover:text-white" onClick={() => setOpen(false)}>×</button>
            <header className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-success/20 text-success">
                <Gift className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.32em] text-textMuted/70">Персональные предложения</p>
                <h2 className="text-xl font-semibold text-white">Массовая отправка</h2>
              </div>
            </header>
            <div className="mt-6 grid gap-6">
              <div className="rounded-2xl border border-outline/40 bg-surface/70 p-3">
                <div className="mb-2 text-[10px] uppercase tracking-[0.28em] text-textMuted">Сегмент и цель</div>
                <div className="grid gap-2 md:grid-cols-2">
                  <label className="flex flex-col gap-2">
                    <span className="text-xs uppercase tracking-[0.28em] text-textMuted">Сегмент</span>
                    <select className="rounded-2xl border border-outline/40 bg-surface/70 px-3 py-2 text-sm text-white" value={segment} onChange={(e) => setSegment(e.target.value)}>
                      <option value="trial_active">Активный триал</option>
                      <option value="trial_expired">Триал закончился</option>
                      <option value="paid_active">Платная активная</option>
                    </select>
                  </label>
                  <label className="flex flex-col gap-2">
                    <span className="text-xs uppercase tracking-[0.28em] text-textMuted">Шаблон</span>
                    <select className="rounded-2xl border border-outline/40 bg-surface/70 px-3 py-2 text-sm text-white" value={templateId} onChange={(e) => setTemplateId(e.target.value ? Number(e.target.value) : "") }>
                      <option value="">Выберите шаблон</option>
                      {templates.map((t) => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>

              <div className="rounded-2xl border border-outline/40 bg-surface/70 p-3">
                <div className="mb-2 text-[10px] uppercase tracking-[0.28em] text-textMuted">Параметры</div>
                <div className="grid gap-2 md:grid-cols-3">
                  <label className="flex flex-col gap-2">
                    <span className="text-xs uppercase tracking-[0.28em] text-textMuted">Лимит</span>
                    <input className="rounded-2xl border border-outline/40 bg-surface/60 px-3 py-2 text-sm text-white" type="number" min={1} max={2000} value={limit} onChange={(e) => setLimit(Math.max(1, Math.min(2000, Number(e.target.value) || 1)))} />
                  </label>
                  <label className="flex flex-col gap-2">
                    <span className="text-xs uppercase tracking-[0.28em] text-textMuted">Скидка, %</span>
                    <input className="rounded-2xl border border-outline/40 bg-surface/60 px-3 py-2 text-sm text-white" type="number" min={0} value={discountPercent as any} onChange={(e) => setDiscountPercent(e.target.value === "" ? "" : Math.max(0, Number(e.target.value) || 0))} placeholder="по шаблону" />
                  </label>
                  <label className="flex flex-col gap-2">
                    <span className="text-xs uppercase tracking-[0.28em] text-textMuted">Срок (ч)</span>
                    <input className="rounded-2xl border border-outline/40 bg-surface/60 px-3 py-2 text-sm text-white" type="number" min={1} value={validHours as any} onChange={(e) => setValidHours(e.target.value === "" ? "" : Math.max(1, Number(e.target.value) || 1))} placeholder="по шаблону" />
                  </label>
                </div>
                <label className="mt-2 flex items-center gap-2">
                  <input type="checkbox" checked={sendNotification} onChange={(e) => setSendNotification(e.target.checked)} />
                  <span className="text-sm text-textMuted">Отправить уведомления</span>
                </label>
              </div>
              <label className="flex flex-col gap-2">
                <span className="text-xs uppercase tracking-[0.28em] text-textMuted">Сегмент</span>
                <select className="rounded-2xl border border-outline/40 bg-surface/70 px-3 py-2 text-sm text-white" value={segment} onChange={(e) => setSegment(e.target.value)}>
                  <option value="trial_active">Активный триал</option>
                  <option value="trial_expired">Триал закончился</option>
                  <option value="paid_active">Платная активная</option>
                </select>
              </label>
              <label className="md:col-span-2 flex flex-col gap-2">
                <span className="text-xs uppercase tracking-[0.28em] text-textMuted">UUID сквадов (для тест‑доступа, через запятую)</span>
                <input className="rounded-2xl border border-outline/40 bg-surface/60 px-3 py-2 text-sm text-white" value={testSquads} onFocus={loadSquads} onChange={(e) => setTestSquads(e.target.value)} placeholder="uuid1, uuid2" />
                {availableSquads.length ? (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {availableSquads.slice(0, 12).map((s:any) => (
                      <button key={s.uuid} type="button" className="rounded-lg border border-outline/40 px-2 py-1 text-xs text-textMuted hover:text-white" onClick={() => setTestSquads(v => (v ? (v+", "+s.uuid) : s.uuid))}>
                        {s.name}
                      </button>
                    ))}
                  </div>
                ) : null}
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-xs uppercase tracking-[0.28em] text-textMuted">Длительность теста (ч) — переопределить</span>
                <input className="rounded-2xl border border-outline/40 bg-surface/60 px-3 py-2 text-sm text-white" type="number" min={1} value={testDurationHours as any} onChange={(e) => setTestDurationHours(e.target.value === "" ? "" : Math.max(1, Number(e.target.value) || 1))} placeholder="по шаблону" />
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-xs uppercase tracking-[0.28em] text-textMuted">Шаблон</span>
                <select className="rounded-2xl border border-outline/40 bg-surface/70 px-3 py-2 text-sm text-white" value={templateId} onChange={(e) => setTemplateId(e.target.value ? Number(e.target.value) : "") }>
                  <option value="">Выберите шаблон</option>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-xs uppercase tracking-[0.28em] text-textMuted">Лимит</span>
                <input className="rounded-2xl border border-outline/40 bg-surface/60 px-3 py-2 text-sm text-white" type="number" min={1} max={2000} value={limit} onChange={(e) => setLimit(Math.max(1, Math.min(2000, Number(e.target.value) || 1)))} />
                <span className="text-[11px] text-textMuted">Максимум пользователей для отправки за раз</span>
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-xs uppercase tracking-[0.28em] text-textMuted">Скидка, % (переопределить)</span>
                <input className="rounded-2xl border border-outline/40 bg-surface/60 px-3 py-2 text-sm text-white" type="number" min={0} value={discountPercent as any} onChange={(e) => setDiscountPercent(e.target.value === "" ? "" : Math.max(0, Number(e.target.value) || 0))} placeholder="по шаблону" />
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-xs uppercase tracking-[0.28em] text-textMuted">Срок (ч) (переопределить)</span>
                <input className="rounded-2xl border border-outline/40 bg-surface/60 px-3 py-2 text-sm text-white" type="number" min={1} value={validHours as any} onChange={(e) => setValidHours(e.target.value === "" ? "" : Math.max(1, Number(e.target.value) || 1))} placeholder="по шаблону" />
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={sendNotification} onChange={(e) => setSendNotification(e.target.checked)} />
                <span className="text-sm text-textMuted">Отправить уведомления</span>
              </label>
              <div className="grid gap-2 rounded-2xl border border-outline/40 bg-surface/70 p-3">
                <span className="text-xs uppercase tracking-[0.28em] text-textMuted">Медиа (необязательно)</span>
                <div className="grid gap-2 md:grid-cols-3">
                  <select className="rounded-2xl border border-outline/40 bg-surface/70 px-3 py-2 text-sm text-white" value={mediaType} onChange={(e) => setMediaType(e.target.value)}>
                    <option value="">Тип не выбран</option>
                    <option value="photo">Фото</option>
                    <option value="video">Видео</option>
                    <option value="document">Документ</option>
                  </select>
                  <input className="rounded-2xl border border-outline/40 bg-surface/70 px-3 py-2 text-sm text-white" placeholder="Telegram file_id" value={mediaFileId} onChange={(e) => setMediaFileId(e.target.value)} />
                  <MediaUploader onUploaded={(m) => { setMediaType(m.type); setMediaFileId(m.file_id); setMediaUploadError(""); }} onError={(msg) => setMediaUploadError(msg)} />
                </div>
                {mediaUploadError ? <div className="text-xs text-danger">{mediaUploadError}</div> : null}
                {mediaType && mediaFileId ? (
                  <div className="text-xs text-textMuted">Будет отправлено {mediaType} с file_id: {mediaFileId}</div>
                ) : (
                  <div className="text-xs text-textMuted">Можете вставить готовый file_id или загрузить файл</div>
                )}
              </div>
            </div>
            <footer className="mt-6 flex items-center justify-end gap-3">
              <button type="button" className="button-ghost" onClick={() => setOpen(false)} disabled={isSending}>Отмена</button>
              <button
                type="button"
                className="button-primary"
                disabled={isSending || !templateId}
                onClick={async () => {
                  const payload = {
                    segment,
                    template_id: templateId,
                    limit,
                    discount_percent: discountPercent === "" ? undefined : Number(discountPercent),
                    valid_hours: validHours === "" ? undefined : Number(validHours),
                    send_notification: sendNotification,
                    test_squad_uuids: testSquads ? testSquads.split(",").map(s => s.trim()).filter(Boolean) : undefined,
                    test_duration_hours: testDurationHours === "" ? undefined : Number(testDurationHours),
                    media_type: mediaType || undefined,
                    media_file_id: mediaFileId || undefined,
                  } as any;
                  setPreviewData(payload);
                  setPreviewOpen(true);
                }}
              >
                Отправить
              </button>
            </footer>
          </div>
        </div>
      ) : null}

      {previewOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-xl rounded-3xl border border-outline/40 bg-surface/95 p-6">
            <div className="mb-4 text-lg font-semibold text-white">Предпросмотр</div>
            <div className="space-y-2 text-sm text-textMuted">
              <div>Сегмент: <span className="text-white">{segment}</span></div>
              <div>Шаблон: <span className="text-white">{templateId || "—"}</span></div>
              <div>Лимит: <span className="text-white">{limit}</span></div>
              <div>Скидка: <span className="text-white">{discountPercent === "" ? "по шаблону" : discountPercent + "%"}</span></div>
              <div>Срок: <span className="text-white">{validHours === "" ? "по шаблону" : validHours + " ч"}</span></div>
              <div>Тест‑сквады: <span className="text-white">{testSquads || "—"}</span></div>
              <div>Длительность теста: <span className="text-white">{testDurationHours === "" ? "по шаблону" : testDurationHours + " ч"}</span></div>
              <div>Медиа: <span className="text-white">{mediaType && mediaFileId ? `${mediaType} (${mediaFileId})` : "нет"}</span></div>
            </div>
            <div className="mt-4 flex items-center justify-end gap-2">
              <button className="button-ghost" onClick={() => setPreviewOpen(false)} disabled={isSending}>Назад</button>
              <button className="button-primary" disabled={isSending} onClick={async () => {
                await onSend(previewData);
                setPreviewOpen(false);
                setOpen(false);
              }}>Отправить</button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function ruTypeLabel(type: string): string {
  switch ((type || "").trim()) {
    case "extend_discount":
      return "Скидка на продление";
    case "purchase_discount":
      return "Скидка на покупку";
    case "test_access":
      return "Тестовый доступ";
    case "custom":
      return "Промо";
    default:
      return type || "—";
  }
}

function ruActionLabel(action?: string | null): string {
  switch ((action || "").trim()) {
    case "claimed": return "Активировано";
    case "enabled": return "Включено";
    case "disabled": return "Отключено";
    default: return action || "—";
  }
}

function ruSourceLabel(source?: string | null): string {
  const s = (source || "").trim();
  if (!s) return "—";
  if (s.startsWith("promo_template_")) return "Промо по шаблону";
  if (s === "promo_template") return "Промо по шаблону";
  if (s === "subscription_renewal") return "Продление подписки";
  if (s === "custom") return "Промо (custom)";
  return s;
}

function ruEffectLabel(effect?: string | null): string {
  switch ((effect || "").trim()) {
    case "percent_discount": return "Скидка %";
    case "balance_bonus": return "Бонус на баланс";
    case "test_access": return "Тестовый доступ";
    default: return effect || "—";
  }
}

function buildLogDescription(e: any): string {
  const details = e?.details || {};
  const parts: string[] = [];
  if (typeof e.percent === "number") parts.push(`Скидка: ${e.percent}%`);
  if (details.reason) {
    const map: Record<string, string> = {
      offer_expired: "Срок предложения истёк",
      offer_deleted: "Предложение удалено",
      offer_enabled: "Предложение включено",
      test_access_expired: "Тест‑доступ истёк",
      test_access_claim: "Тест‑доступ выдан",
    };
    parts.push(map[details.reason] || String(details.reason));
  }
  if (details.squad_uuid) parts.push(`Сквад: ${details.squad_uuid}`);
  if (details.expires_at) parts.push(`Действует до: ${new Date(details.expires_at).toLocaleString("ru-RU")}`);
  return parts.join(" · ") || "—";
}

function MediaUploader({ onUploaded, onError }: { onUploaded: (r: { file_id: string; type: string }) => void; onError: (msg: string) => void }) {
  const [busy, setBusy] = useState(false);
  const [type, setType] = useState<string>("photo");
  const [file, setFile] = useState<File | null>(null);
  return (
    <div className="flex items-center gap-2">
      <select className="rounded-2xl border border-outline/40 bg-surface/70 px-3 py-2 text-sm text-white" value={type} onChange={(e) => setType(e.target.value)}>
        <option value="photo">Фото</option>
        <option value="video">Видео</option>
        <option value="document">Документ</option>
      </select>
      <input type="file" className="text-xs text-textMuted" onChange={(e) => setFile(e.target.files?.[0] || null)} />
      <button type="button" className="rounded-xl border border-outline/40 bg-surface/60 px-3 py-1 text-xs text-textMuted hover:text-white disabled:opacity-50" disabled={busy || !file} onClick={async () => {
        if (!file) return;
        setBusy(true);
        try {
          const form = new FormData();
          form.append("media_type", type);
          form.append("file", file);
          const { data } = await apiClient.post("/broadcasts/media/upload", form, { headers: { "Content-Type": "multipart/form-data" } });
          onUploaded({ file_id: data.file_id, type: data.type });
        } catch (e: any) {
          onError(e?.message || "Ошибка загрузки медиа");
        } finally {
          setBusy(false);
        }
      }}>Загрузить</button>
    </div>
  );
}


