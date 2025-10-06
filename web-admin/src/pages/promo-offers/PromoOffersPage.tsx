import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Edit3, Gift, ListFilter, Plus, RefreshCw, Save, X } from "lucide-react";
import { useCreatePromoOffer, useCreatePromoOfferTemplate, usePromoOfferLogs, usePromoOfferTemplates, usePromoOffersList, useUpdatePromoOfferTemplate } from "@/features/promo-offers/queries";
import type { PromoOfferCreateInput } from "@/features/promo-offers/api";

const PAGE_SIZE = 25;

export default function PromoOffersPage() {
  const { data, params, setParams, isLoading, isFetching } = usePromoOffersList({ limit: PAGE_SIZE, offset: 0 });
  const { data: logs, params: logParams, setParams: setLogParams, isLoading: logsLoading, isFetching: logsFetching } = usePromoOfferLogs({ limit: PAGE_SIZE, offset: 0 });
  const { data: templates } = usePromoOfferTemplates();
  const createTemplate = useCreatePromoOfferTemplate();
  const updateTemplate = useUpdatePromoOfferTemplate();
  const createMutation = useCreatePromoOffer();

  const canPrev = (params.offset ?? 0) > 0;
  const canNext = data ? (params.offset ?? 0) + (params.limit ?? PAGE_SIZE) < data.total : false;
  const meta = useMemo(() => {
    if (!data) return "";
    const start = (data.offset ?? 0) + 1;
    const end = Math.min((data.offset ?? 0) + (data.limit ?? PAGE_SIZE), data.total);
    return `${start}–${end} из ${data.total}`;
  }, [data]);

  const [isFormOpen, setFormOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any | null>(null);
  const [isTemplateDialogOpen, setTemplateDialogOpen] = useState(false);

  return (
    <div className="space-y-6">
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
        </div>
      </div>

      <OffersTable
        items={data?.items ?? []}
        isLoading={isLoading || isFetching}
        onFilter={(q) => setParams((p) => ({ ...p, ...q, offset: 0 }))}
      />

      <section className="space-y-4">
        <header className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Журнал операций</h2>
          <div className="flex items-center gap-2 text-xs text-textMuted">
            <ListFilter className="h-4 w-4" />
            <input className="rounded-xl border border-outline/40 bg-surface/60 px-3 py-1 text-sm text-white" placeholder="User ID" value={String(logParams.user_id ?? "")} onChange={(e) => setLogParams((p) => ({ ...p, user_id: e.target.value ? Number(e.target.value) : undefined, offset: 0 }))} />
          </div>
        </header>
        <LogsTable items={logs?.items ?? []} isLoading={logsLoading || logsFetching} />
      </section>

      {isFormOpen ? (
        <CreateOfferDialog
          templates={templates ?? []}
          onClose={() => setFormOpen(false)}
          onCreate={(input) => createMutation.mutateAsync(input).then(() => setFormOpen(false))}
          isSubmitting={createMutation.isPending}
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
                  <td className="px-4 py-3 text-textMuted">{t.offer_type}</td>
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
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
    </div>
  );
}

function OffersTable({ items, isLoading, onFilter }: { items: any[]; isLoading?: boolean; onFilter: (q: Record<string, any>) => void }) {
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
          </tr>
        </thead>
        <tbody className="divide-y divide-outline/40">
          {items.map((o) => (
            <tr key={o.id} className="bg-surface/60">
              <td className="px-4 py-3 font-medium text-white">{o.user?.username ? `@${o.user.username}` : `#${o.userId}`}</td>
              <td className="px-4 py-3 text-textMuted">{o.notificationType}</td>
              <td className="px-4 py-3 text-textMuted">{o.discountPercent}%</td>
              <td className="px-4 py-3 text-textMuted">{o.bonusRubles?.toFixed(2)} ₽</td>
              <td className="px-4 py-3 text-textMuted">до {new Date(o.expiresAt).toLocaleString("ru-RU")}</td>
              <td className="px-4 py-3 text-textMuted">{o.isActive ? "Активно" : "Выключено"}</td>
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
            <th className="px-4 py-3 text-left">Скидка</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-outline/40">
          {items.map((e) => (
            <tr key={e.id} className="bg-surface/60">
              <td className="px-4 py-3 text-textMuted">{new Date(e.created_at).toLocaleString("ru-RU")}</td>
              <td className="px-4 py-3 text-textMuted">{e.user?.username ? `@${e.user.username}` : `#${e.user_id}`}</td>
              <td className="px-4 py-3 text-textMuted">{e.action}</td>
              <td className="px-4 py-3 text-textMuted">{e.source ?? "—"}</td>
              <td className="px-4 py-3 text-textMuted">{e.percent ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CreateOfferDialog({ templates, onClose, onCreate, isSubmitting }: { templates: any[]; onClose: () => void; onCreate: (input: PromoOfferCreateInput) => Promise<void>; isSubmitting: boolean }) {
  const [userId, setUserId] = useState("");
  const [templateId, setTemplateId] = useState<number | "">(templates[0]?.id ?? "");
  const [validHours, setValidHours] = useState(48);
  const [discountPercent, setDiscountPercent] = useState(20);
  const [bonusRubles, setBonusRubles] = useState(0);
  const [notificationType, setNotificationType] = useState("custom");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const payload: PromoOfferCreateInput = {
      user_id: userId ? Number(userId) : 0,
      notification_type: notificationType,
      valid_hours: Number(validHours),
      discount_percent: Number(discountPercent),
      bonus_amount_kopeks: Math.round(Number(bonusRubles) * 100),
      effect_type: "percent_discount",
      extra_data: { template_id: templateId || undefined },
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
              <span className="text-xs uppercase tracking-[0.28em] text-textMuted">User ID</span>
              <input className="rounded-2xl border border-outline/40 bg-surface/60 px-3 py-2 text-sm text-white" inputMode="numeric" pattern="[0-9]*" value={userId} onChange={(e) => setUserId(e.target.value.replace(/[^0-9]/g, ""))} placeholder="Внутренний ID или Telegram ID" />
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-xs uppercase tracking-[0.28em] text-textMuted">Шаблон</span>
              <select className="rounded-2xl border border-outline/40 bg-surface/70 px-3 py-2 text-sm text-white" value={templateId} onChange={(e) => setTemplateId(e.target.value ? Number(e.target.value) : "") }>
                <option value="">Не использовать</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-xs uppercase tracking-[0.28em] text-textMuted">Срок (часов)</span>
              <input className="rounded-2xl border border-outline/40 bg-surface/60 px-3 py-2 text-sm text-white" type="number" min={1} value={validHours} onChange={(e) => setValidHours(Number(e.target.value))} />
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-xs uppercase tracking-[0.28em] text-textMuted">Скидка, %</span>
              <input className="rounded-2xl border border-outline/40 bg-surface/60 px-3 py-2 text-sm text-white" type="number" min={0} value={discountPercent} onChange={(e) => setDiscountPercent(Number(e.target.value))} />
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-xs uppercase tracking-[0.28em] text-textMuted">Бонус, ₽</span>
              <input className="rounded-2xl border border-outline/40 bg-surface/60 px-3 py-2 text-sm text-white" type="number" min={0} value={bonusRubles} onChange={(e) => setBonusRubles(Number(e.target.value))} />
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-xs uppercase tracking-[0.28em] text-textMuted">Тип уведомления</span>
              <input className="rounded-2xl border border-outline/40 bg-surface/60 px-3 py-2 text-sm text-white" value={notificationType} onChange={(e) => setNotificationType(e.target.value)} placeholder="custom / subscription_renewal / ..." />
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
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-xs uppercase tracking-[0.28em] text-textMuted">Тип</span>
              <select className="rounded-2xl border border-outline/40 bg-surface/70 px-3 py-2 text-sm text-white" value={offerType} onChange={(e) => setOfferType(e.target.value)}>
                <option value="custom">custom</option>
                <option value="extend_discount">extend_discount</option>
                <option value="purchase_discount">purchase_discount</option>
                <option value="test_access">test_access</option>
              </select>
            </label>
            <label className="md:col-span-2 flex flex-col gap-2">
              <span className="text-xs uppercase tracking-[0.28em] text-textMuted">Текст сообщения</span>
              <textarea rows={5} className="rounded-2xl border border-outline/40 bg-surface/60 px-3 py-2 text-sm text-white" value={messageText} onChange={(e) => setMessageText(e.target.value)} />
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-xs uppercase tracking-[0.28em] text-textMuted">Текст кнопки</span>
              <input className="rounded-2xl border border-outline/40 bg-surface/60 px-3 py-2 text-sm text-white" value={buttonText} onChange={(e) => setButtonText(e.target.value)} />
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-xs uppercase tracking-[0.28em] text-textMuted">Срок действия (ч)</span>
              <input type="number" min={1} className="rounded-2xl border border-outline/40 bg-surface/60 px-3 py-2 text-sm text-white" value={validHours} onChange={(e) => setValidHours(Number(e.target.value))} />
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-xs uppercase tracking-[0.28em] text-textMuted">Скидка, %</span>
              <input type="number" min={0} className="rounded-2xl border border-outline/40 bg-surface/60 px-3 py-2 text-sm text-white" value={discountPercent} onChange={(e) => setDiscountPercent(Number(e.target.value))} />
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-xs uppercase tracking-[0.28em] text-textMuted">Бонус, ₽</span>
              <input type="number" min={0} className="rounded-2xl border border-outline/40 bg-surface/60 px-3 py-2 text-sm text-white" value={bonusRubles} onChange={(e) => setBonusRubles(Number(e.target.value))} />
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-xs uppercase tracking-[0.28em] text-textMuted">Активная скидка (ч)</span>
              <input type="number" min={1} className="rounded-2xl border border-outline/40 bg-surface/60 px-3 py-2 text-sm text-white" value={activeDiscountHours as any} onChange={(e) => setActiveDiscountHours(e.target.value === "" ? "" : Number(e.target.value))} placeholder="пусто = не используется" />
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-xs uppercase tracking-[0.28em] text-textMuted">Длительность теста (ч)</span>
              <input type="number" min={1} className="rounded-2xl border border-outline/40 bg-surface/60 px-3 py-2 text-sm text-white" value={testDurationHours as any} onChange={(e) => setTestDurationHours(e.target.value === "" ? "" : Number(e.target.value))} placeholder="пусто = не используется" />
            </label>
            <label className="md:col-span-2 flex flex-col gap-2">
              <span className="text-xs uppercase tracking-[0.28em] text-textMuted">Test squad UUIDs (через запятую)</span>
              <input className="rounded-2xl border border-outline/40 bg-surface/60 px-3 py-2 text-sm text-white" value={testSquads} onChange={(e) => setTestSquads(e.target.value)} placeholder="uuid1, uuid2" />
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
              <span className="text-sm text-textMuted">Активен</span>
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


