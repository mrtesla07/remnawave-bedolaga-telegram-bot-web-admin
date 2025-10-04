import { useCallback, useMemo, useState } from "react";
import type { ReactNode, FormEvent } from "react";
import { Gift, Gauge, Users, Percent, Sparkles, Trash2, Edit3, Plus, Activity, Clock3 } from "lucide-react";
import type { PromoGroup, PromoGroupInput } from "@/features/promo-groups/api";
import { usePromoGroupsList, useCreatePromoGroup, useUpdatePromoGroup, useDeletePromoGroup } from "@/features/promo-groups/queries";
import { AnimatedNumber } from "@/components/shared/AnimatedNumber";
import { usePromocodesList, useCreatePromocode, useUpdatePromocode, useDeletePromocode } from "@/features/promocodes/queries";
import type { PromoCode, PromoCodeCreateInput } from "@/features/promocodes/api";

const PAGE_SIZE = 20;

export function PromocodesPage() {
  const { data, params, setParams, isLoading, isFetching } = usePromoGroupsList({ limit: PAGE_SIZE, offset: 0 });
  const items = data?.items ?? [];

  const createMutation = useCreatePromoGroup();
  const updateMutation = useUpdatePromoGroup();
  const deleteMutation = useDeletePromoGroup();

  const promoQuery = usePromocodesList({ limit: 25, offset: 0 });
  const promoCreate = useCreatePromocode();
  const promoUpdate = useUpdatePromocode();
  const promoDelete = useDeletePromocode();

  const [editing, setEditing] = useState<PromoGroup | null>(null);
  const [isFormOpen, setFormOpen] = useState(false);
  const [promoFormOpen, setPromoFormOpen] = useState(false);

  const canPrev = (params.offset ?? 0) > 0;
  const canNext = data ? (params.offset ?? 0) + (params.limit ?? PAGE_SIZE) < data.total : false;

  const meta = useMemo(() => {
    if (!data) return "";
    const start = (data.offset ?? 0) + 1;
    const end = Math.min((data.offset ?? 0) + (data.limit ?? PAGE_SIZE), data.total);
    return `${start}–${end} из ${data.total}`;
  }, [data]);

  const handleCreate = useCallback(async (input: PromoGroupInput) => {
    await createMutation.mutateAsync(input);
    setFormOpen(false);
  }, [createMutation]);

  const handleUpdate = useCallback(async (id: number, input: Partial<PromoGroupInput>) => {
    await updateMutation.mutateAsync({ id, data: input });
    setEditing(null);
  }, [updateMutation]);

  const handleDelete = useCallback(async (id: number) => {
    await deleteMutation.mutateAsync(id);
  }, [deleteMutation]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Промокоды</h1>
          <p className="text-sm text-textMuted">Управление промо-группами, скидками и автоматическими правилами назначения.</p>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-xl bg-primary/20 px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/30"
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <Plus className="h-4 w-4" /> Новая группа
        </button>
      </div>

      <PromoGroupsSummary items={items} isLoading={isLoading || isFetching} />

      <PromoGroupsTable
        items={items}
        isLoading={isLoading || isFetching}
        onEdit={(group) => {
          setEditing(group);
          setFormOpen(true);
        }}
        onDelete={handleDelete}
      />

      <section className="space-y-4">
        <header className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Промокоды</h2>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl bg-primary/20 px-3 py-2 text-sm font-semibold text-primary hover:bg-primary/30"
            onClick={() => setPromoFormOpen(true)}
          >
            <Plus className="h-4 w-4" /> Новый промокод
          </button>
        </header>
        <PromocodesTable
          items={promoQuery.data?.items ?? []}
          isLoading={promoQuery.isLoading || promoQuery.isFetching}
          onDelete={(id) => promoDelete.mutate(id)}
          onToggleActive={(pc) => promoUpdate.mutate({ id: pc.id, data: { isActive: !pc.isActive } })}
        />
      </section>

      <div className="flex items-center justify-between rounded-2xl border border-outline/40 bg-surfaceMuted/40 px-4 py-3 text-sm text-textMuted">
        <span>{meta}</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="button-ghost"
            disabled={!canPrev}
            onClick={() => setParams((prev) => ({ ...prev, offset: Math.max((prev?.offset ?? 0) - (prev?.limit ?? PAGE_SIZE), 0) }))}
          >
            Назад
          </button>
          <button
            type="button"
            className="button-primary"
            disabled={!canNext}
            onClick={() => setParams((prev) => ({ ...prev, offset: (prev?.offset ?? 0) + (prev?.limit ?? PAGE_SIZE) }))}
          >
            Далее
          </button>
        </div>
      </div>

      {isFormOpen ? (
        <PromoGroupFormDialog
          group={editing}
          onClose={() => {
            setFormOpen(false);
            setEditing(null);
          }}
          onCreate={handleCreate}
          onUpdate={handleUpdate}
          isSubmitting={createMutation.isPending || updateMutation.isPending}
        />
      ) : null}

      {promoFormOpen ? (
        <PromocodeFormDialog
          onClose={() => setPromoFormOpen(false)}
          onCreate={(input) => promoCreate.mutateAsync(input).then(() => setPromoFormOpen(false))}
          isSubmitting={promoCreate.isPending}
        />
      ) : null}
    </div>
  );
}

function PromoGroupsSummary({ items, isLoading }: { items: PromoGroup[]; isLoading?: boolean }) {
  const totalMembers = items.reduce((acc, group) => acc + group.membersCount, 0);
  const defaultGroup = items.find((group) => group.isDefault);
  const highestServer = items.reduce((max, group) => Math.max(max, group.serverDiscountPercent), 0);
  const highestTraffic = items.reduce((max, group) => Math.max(max, group.trafficDiscountPercent), 0);

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <SummaryCard icon={<Users className="h-4 w-4 text-sky" />} title="Группы" value={<AnimatedNumber value={items.length} />} caption="Активные промо-группы" />
      <SummaryCard icon={<Gauge className="h-4 w-4 text-warning" />} title="Участники" value={<AnimatedNumber value={totalMembers} />} caption="Общее количество пользователей" />
      <SummaryCard icon={<Activity className="h-4 w-4 text-primary" />} title="Max скидка серверов" value={`${highestServer}%`} caption="Среди всех групп" />
      <SummaryCard
        icon={<Percent className="h-4 w-4 text-success" />}
        title="Группа по умолчанию"
        value={defaultGroup ? defaultGroup.name : "Не назначена"}
        caption={defaultGroup ? `${defaultGroup.membersCount} участников` : "Назначьте в настройках группы"}
      />
    </div>
  );
}

function SummaryCard({ icon, title, value, caption }: { icon: ReactNode; title: string; value: ReactNode; caption?: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-outline/40 bg-surfaceMuted/40 p-3">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface/60">{icon}</span>
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-[0.28em] text-textMuted/70">{title}</p>
        <div className="truncate text-sm font-semibold text-white">{value}</div>
        {caption ? <p className="truncate text-xs text-textMuted">{caption}</p> : null}
      </div>
    </div>
  );
}

function PromoGroupsTable({ items, isLoading, onEdit, onDelete }: { items: PromoGroup[]; isLoading?: boolean; onEdit: (group: PromoGroup) => void; onDelete: (id: number) => void }) {
  if (isLoading) {
    return <div className="rounded-3xl border border-outline/40 bg-surface/60 p-8 text-center text-textMuted">Загрузка…</div>;
  }
  if (!items.length) {
    return <div className="rounded-3xl border border-outline/40 bg-surface/60 p-8 text-center text-textMuted">Промо-группы не найдены.</div>;
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-outline/40">
      <table className="min-w-full divide-y divide-outline/40 bg-surface/80 text-sm">
        <thead className="bg-surfaceMuted/40 text-xs uppercase tracking-[0.28em] text-textMuted">
          <tr>
            <th className="px-4 py-3 text-left">Название</th>
            <th className="px-4 py-3 text-left">Скидки</th>
            <th className="px-4 py-3 text-left">Правила</th>
            <th className="px-4 py-3 text-left">Участники</th>
            <th className="px-4 py-3 text-left">Создана</th>
            <th className="px-4 py-3 text-left">Действия</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-outline/40">
          {items.map((group) => (
            <tr key={group.id} className="bg-surface/60">
              <td className="px-4 py-3 font-medium text-white">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/20 text-primary"><Gift className="h-4 w-4" /></span>
                  <div>
                    <p className="font-semibold">{group.name}</p>
                    <p className="text-xs text-textMuted">ID: {group.id}{group.isDefault ? " · по умолчанию" : ""}</p>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3 text-textMuted">
                <div className="flex flex-wrap gap-2 text-xs">
                  <Badge tone="primary">Серверы {group.serverDiscountPercent}%</Badge>
                  <Badge tone="success">Трафик {group.trafficDiscountPercent}%</Badge>
                  <Badge tone="warning">Устройства {group.deviceDiscountPercent}%</Badge>
                </div>
                {Object.keys(group.periodDiscounts).length ? (
                  <div className="mt-2 space-x-2 text-xs text-textMuted">
                    {Object.entries(group.periodDiscounts).map(([months, discount]) => (
                      <Badge key={months} tone="muted">{months} мес · {discount}%</Badge>
                    ))}
                  </div>
                ) : null}
              </td>
              <td className="px-4 py-3 text-textMuted">
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2">
                    <Clock3 className="h-4 w-4 text-sky" />
                    <span>
                      Автоназначение при расходе {group.autoAssignThresholdRubles ? `${group.autoAssignThresholdRubles.toFixed(2)} ₽` : "—"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <span>Скидки на аддоны: {group.applyDiscountsToAddons ? "да" : "нет"}</span>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3 text-textMuted">{group.membersCount}</td>
              <td className="px-4 py-3 text-textMuted">{new Date(group.createdAt).toLocaleDateString("ru-RU")}</td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <button className="rounded-xl border border-outline/40 bg-surface/60 px-3 py-1 text-xs text-textMuted hover:text-white" onClick={() => onEdit(group)}>
                    <Edit3 className="mr-1 inline h-3.5 w-3.5" /> Редактировать
                  </button>
                  <button
                    className="rounded-xl border border-outline/40 bg-danger/10 px-3 py-1 text-xs text-danger hover:bg-danger/20"
                    onClick={() => onDelete(group.id)}
                    disabled={group.isDefault}
                  >
                    <Trash2 className="mr-1 inline h-3.5 w-3.5" /> Удалить
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Badge({ children, tone }: { children: React.ReactNode; tone?: "primary" | "success" | "warning" | "muted" }) {
  const toneClass =
    tone === "primary"
      ? "bg-primary/15 text-primary"
      : tone === "success"
      ? "bg-success/15 text-success"
      : tone === "warning"
      ? "bg-warning/15 text-warning"
      : "bg-surface/60 text-textMuted";
  return <span className={`inline-flex items-center rounded-lg px-2 py-1 font-medium ${toneClass}`}>{children}</span>;
}

function PromocodesTable({ items, isLoading, onDelete, onToggleActive }: { items: PromoCode[]; isLoading?: boolean; onDelete: (id: number) => void; onToggleActive: (pc: PromoCode) => void }) {
  if (isLoading) {
    return <div className="rounded-3xl border border-outline/40 bg-surface/60 p-8 text-center text-textMuted">Загрузка…</div>;
  }
  if (!items.length) {
    return <div className="rounded-3xl border border-outline/40 bg-surface/60 p-8 text-center text-textMuted">Промокоды не найдены.</div>;
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-outline/40">
      <table className="min-w-full divide-y divide-outline/40 bg-surface/80 text-sm">
        <thead className="bg-surfaceMuted/40 text-xs uppercase tracking-[0.28em] text-textMuted">
          <tr>
            <th className="px-4 py-3 text-left">Код</th>
            <th className="px-4 py-3 text-left">Тип</th>
            <th className="px-4 py-3 text-left">Значение</th>
            <th className="px-4 py-3 text-left">Лимит</th>
            <th className="px-4 py-3 text-left">Срок</th>
            <th className="px-4 py-3 text-left">Статус</th>
            <th className="px-4 py-3 text-left">Действия</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-outline/40">
          {items.map((pc) => (
            <tr key={pc.id} className="bg-surface/60">
              <td className="px-4 py-3 font-medium text-white">{pc.code}</td>
              <td className="px-4 py-3 text-textMuted">{mapPromoType(pc.type)}</td>
              <td className="px-4 py-3 text-textMuted">{renderPromoValue(pc)}</td>
              <td className="px-4 py-3 text-textMuted">{pc.currentUses} / {pc.maxUses} (осталось {pc.usesLeft})</td>
              <td className="px-4 py-3 text-textMuted">{new Date(pc.validFrom).toLocaleDateString("ru-RU")} {pc.validUntil ? `— ${new Date(pc.validUntil).toLocaleDateString("ru-RU")}` : ""}</td>
              <td className="px-4 py-3 text-textMuted">{pc.isActive ? "Активен" : "Выключен"}{pc.isValid ? " · валиден" : " · невалиден"}</td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <button className="rounded-xl border border-outline/40 bg-surface/60 px-3 py-1 text-xs text-textMuted hover:text-white" onClick={() => onToggleActive(pc)}>
                    {pc.isActive ? "Отключить" : "Включить"}
                  </button>
                  <button className="rounded-xl border border-outline/40 bg-danger/10 px-3 py-1 text-xs text-danger hover:bg-danger/20" onClick={() => onDelete(pc.id)}>
                    Удалить
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function mapPromoType(type: string) {
  switch (type) {
    case "balance":
      return "Баланс";
    case "subscription_days":
      return "Дни подписки";
    case "trial_subscription":
      return "Триал";
    default:
      return type;
  }
}

function renderPromoValue(pc: PromoCode) {
  if (pc.type === "balance") {
    return `${pc.bonusRubles.toFixed(2)} ₽`;
  }
  return `${pc.subscriptionDays} дн.`;
}

function PromocodeFormDialog({ onClose, onCreate, isSubmitting }: { onClose: () => void; onCreate: (input: PromoCodeCreateInput) => Promise<void>; isSubmitting: boolean }) {
  const [code, setCode] = useState("");
  const [type, setType] = useState<"balance" | "subscription_days" | "trial_subscription">("balance");
  const [bonus, setBonus] = useState("0");
  const [days, setDays] = useState("0");
  const [maxUses, setMaxUses] = useState("1");
  const [validFrom, setValidFrom] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [isActive, setIsActive] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const input: PromoCodeCreateInput = {
      code,
      type,
      bonusRubles: type === "balance" ? Number(bonus) : 0,
      subscriptionDays: type !== "balance" ? Number(days) : 0,
      maxUses: Number(maxUses) || 1,
      validFrom: validFrom || null,
      validUntil: validUntil || null,
      isActive,
    };
    await onCreate(input);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="relative w-full max-w-xl rounded-3xl border border-outline/40 bg-surface/95 p-8 shadow-card">
        <button className="absolute right-6 top-6 rounded-full bg-surfaceMuted/60 p-2 text-textMuted hover:text-white" onClick={onClose}>×</button>
        <header className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/20 text-primary">
            <Percent className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.32em] text-textMuted/70">Промокод</p>
            <h2 className="text-xl font-semibold text-white">Новый промокод</h2>
          </div>
        </header>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-2">
              <span className="text-xs uppercase tracking-[0.28em] text-textMuted">Код</span>
              <input className="rounded-2xl border border-outline/40 bg-surface/60 px-3 py-2 text-sm text-white placeholder:text-textMuted focus:border-primary/70 focus:outline-none focus:ring-2 focus:ring-primary/40" value={code} onChange={(e) => setCode(e.target.value)} placeholder="VIP2025" required />
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-xs uppercase tracking-[0.28em] text-textMuted">Тип</span>
              <select className="rounded-2xl border border-outline/40 bg-surface/70 px-3 py-2 text-sm text-white focus:border-primary/70 focus:outline-none focus:ring-2 focus:ring-primary/40" value={type} onChange={(e) => setType(e.target.value as any)}>
                <option value="balance">Баланс</option>
                <option value="subscription_days">Дни подписки</option>
                <option value="trial_subscription">Триал подписка</option>
              </select>
            </label>
            {type === "balance" ? (
              <label className="flex flex-col gap-2">
                <span className="text-xs uppercase tracking-[0.28em] text-textMuted">Сумма, ₽</span>
                <input type="number" className="rounded-2xl border border-outline/40 bg-surface/60 px-3 py-2 text-sm text-white focus:border-primary/70 focus:outline-none focus:ring-2 focus:ring-primary/40" value={bonus} onChange={(e) => setBonus(e.target.value)} />
              </label>
            ) : (
              <label className="flex flex-col gap-2">
                <span className="text-xs uppercase tracking-[0.28em] text-textMuted">Дней</span>
                <input type="number" className="rounded-2xl border border-outline/40 bg-surface/60 px-3 py-2 text-sm text-white focus:border-primary/70 focus:outline-none focus:ring-2 focus:ring-primary/40" value={days} onChange={(e) => setDays(e.target.value)} />
              </label>
            )}
            <label className="flex flex-col gap-2">
              <span className="text-xs uppercase tracking-[0.28em] text-textMuted">Лимит использований</span>
              <input type="number" min="0" className="rounded-2xl border border-outline/40 bg-surface/60 px-3 py-2 text-sm text-white focus:border-primary/70 focus:outline-none focus:ring-2 focus:ring-primary/40" value={maxUses} onChange={(e) => setMaxUses(e.target.value)} />
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-xs uppercase tracking-[0.28em] text-textMuted">Начало</span>
              <input type="datetime-local" className="rounded-2xl border border-outline/40 bg-surface/60 px-3 py-2 text-sm text-textMuted focus:border-primary/70 focus:outline-none focus:ring-2 focus:ring-primary/40" value={validFrom} onChange={(e) => setValidFrom(e.target.value)} />
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-xs uppercase tracking-[0.28em] text-textMuted">Окончание</span>
              <input type="datetime-local" className="rounded-2xl border border-outline/40 bg-surface/60 px-3 py-2 text-sm text-textMuted focus:border-primary/70 focus:outline-none focus:ring-2 focus:ring-primary/40" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
              <span className="text-sm text-textMuted">Активен</span>
            </label>
          </div>
          <footer className="flex items-center justify-end gap-3">
            <button type="button" className="button-ghost" onClick={onClose} disabled={isSubmitting}>Отмена</button>
            <button type="submit" className="button-primary" disabled={isSubmitting}>Создать</button>
          </footer>
        </form>
      </div>
    </div>
  );
}

function PromoGroupFormDialog({
  group,
  onClose,
  onCreate,
  onUpdate,
  isSubmitting,
}: {
  group: PromoGroup | null;
  onClose: () => void;
  onCreate: (input: PromoGroupInput) => Promise<void>;
  onUpdate: (id: number, input: Partial<PromoGroupInput>) => Promise<void>;
  isSubmitting: boolean;
}) {
  const isEdit = Boolean(group);
  const [name, setName] = useState(group?.name ?? "");
  const [serverDiscount, setServerDiscount] = useState(group?.serverDiscountPercent ?? 0);
  const [trafficDiscount, setTrafficDiscount] = useState(group?.trafficDiscountPercent ?? 0);
  const [deviceDiscount, setDeviceDiscount] = useState(group?.deviceDiscountPercent ?? 0);
  const [periodDiscounts, setPeriodDiscounts] = useState<Record<number, number>>(group?.periodDiscounts ?? {});
  const [autoAssign, setAutoAssign] = useState<string>(
    group?.autoAssignThresholdRubles != null ? String(group.autoAssignThresholdRubles) : ""
  );
  const [applyAddons, setApplyAddons] = useState(group?.applyDiscountsToAddons ?? true);
  const [isDefault, setIsDefault] = useState(group?.isDefault ?? false);

  const [periodKey, setPeriodKey] = useState("1");
  const [periodValue, setPeriodValue] = useState("10");

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const payload: PromoGroupInput = {
      name,
      serverDiscountPercent: Number(serverDiscount) || 0,
      trafficDiscountPercent: Number(trafficDiscount) || 0,
      deviceDiscountPercent: Number(deviceDiscount) || 0,
      periodDiscounts,
      autoAssignThresholdRubles: autoAssign ? Number(autoAssign) : null,
      applyDiscountsToAddons: applyAddons,
      isDefault,
    };
    if (isEdit && group) {
      await onUpdate(group.id, payload);
    } else {
      await onCreate(payload);
    }
  };

  const handleAddPeriod = () => {
    const months = Number(periodKey);
    const discount = Number(periodValue);
    if (!Number.isFinite(months) || months <= 0 || !Number.isFinite(discount)) return;
    setPeriodDiscounts((prev) => ({ ...prev, [months]: discount }));
    setPeriodKey(String(months + 1));
    setPeriodValue(String(discount));
  };

  const handleRemovePeriod = (months: number) => {
    setPeriodDiscounts((prev) => {
      const next = { ...prev };
      delete next[months];
      return next;
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="relative w-full max-w-2xl rounded-3xl border border-outline/40 bg-surface/95 p-8 shadow-card">
        <button className="absolute right-6 top-6 rounded-full bg-surfaceMuted/60 p-2 text-textMuted hover:text-white" onClick={onClose}>
          ×
        </button>
        <header className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/20 text-primary">
            <Gift className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.32em] text-textMuted/70">Промо-группа</p>
            <h2 className="text-xl font-semibold text-white">{isEdit ? "Редактирование" : "Новая группа"}</h2>
          </div>
        </header>

        <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-2">
              <span className="text-xs uppercase tracking-[0.28em] text-textMuted">Название</span>
              <input
                className="rounded-2xl border border-outline/40 bg-surface/60 px-3 py-2 text-sm text-white placeholder:text-textMuted focus:border-primary/70 focus:outline-none focus:ring-2 focus:ring-primary/40"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                placeholder="Например, VIP"
              />
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-xs uppercase tracking-[0.28em] text-textMuted">По умолчанию</span>
              <select
                className="rounded-2xl border border-outline/40 bg-surface/70 px-3 py-2 text-sm text-white focus:border-primary/70 focus:outline-none focus:ring-2 focus:ring-primary/40"
                value={isDefault ? "yes" : "no"}
                onChange={(event) => setIsDefault(event.target.value === "yes")}
              >
                <option value="no">Нет</option>
                <option value="yes">Да</option>
              </select>
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-xs uppercase tracking-[0.28em] text-textMuted">Скидка на серверы (%)</span>
              <input
                type="number"
                className="rounded-2xl border border-outline/40 bg-surface/60 px-3 py-2 text-sm text-white focus:border-primary/70 focus:outline-none focus:ring-2 focus:ring-primary/40"
                value={serverDiscount}
                onChange={(event) => setServerDiscount(Number(event.target.value))}
              />
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-xs uppercase tracking-[0.28em] text-textMuted">Скидка на трафик (%)</span>
              <input
                type="number"
                className="rounded-2xl border border-outline/40 bg-surface/60 px-3 py-2 text-sm text-white focus:border-primary/70 focus:outline-none focus:ring-2 focus:ring-primary/40"
                value={trafficDiscount}
                onChange={(event) => setTrafficDiscount(Number(event.target.value))}
              />
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-xs uppercase tracking-[0.28em] text-textMuted">Скидка на устройства (%)</span>
              <input
                type="number"
                className="rounded-2xl border border-outline/40 bg-surface/60 px-3 py-2 text-sm text-white focus:border-primary/70 focus:outline-none focus:ring-2 focus:ring-primary/40"
                value={deviceDiscount}
                onChange={(event) => setDeviceDiscount(Number(event.target.value))}
              />
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-xs uppercase tracking-[0.28em] text-textMuted">Автоназначение (₽)</span>
              <input
                type="number"
                min="0"
                className="rounded-2xl border border-outline/40 bg-surface/60 px-3 py-2 text-sm text-white focus:border-primary/70 focus:outline-none focus:ring-2 focus:ring-primary/40"
                value={autoAssign}
                onChange={(event) => setAutoAssign(event.target.value)}
                placeholder="Сумма расходов для автоматического переноса"
              />
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-xs uppercase tracking-[0.28em] text-textMuted">Скидки на аддоны</span>
              <select
                className="rounded-2xl border border-outline/40 bg-surface/70 px-3 py-2 text-sm text-white focus:border-primary/70 focus:outline-none focus:ring-2 focus:ring-primary/40"
                value={applyAddons ? "yes" : "no"}
                onChange={(event) => setApplyAddons(event.target.value === "yes")}
              >
                <option value="yes">Да</option>
                <option value="no">Нет</option>
              </select>
            </label>
          </div>

          <section className="space-y-3">
            <header className="flex items-center justify-between">
              <p className="text-sm font-semibold text-white">Скидки по длительности</p>
              <div className="flex items-center gap-2 text-xs text-textMuted">
                <input
                  type="number"
                  min="1"
                  className="h-9 w-20 rounded-xl border border-outline/40 bg-surface/60 px-3 py-1 text-sm text-white focus:border-primary/70 focus:outline-none focus:ring-2 focus:ring-primary/40"
                  value={periodKey}
                  onChange={(event) => setPeriodKey(event.target.value)}
                  placeholder="Мес"
                />
                <input
                  type="number"
                  className="h-9 w-20 rounded-xl border border-outline/40 bg-surface/60 px-3 py-1 text-sm text-white focus:border-primary/70 focus:outline-none focus:ring-2 focus:ring-primary/40"
                  value={periodValue}
                  onChange={(event) => setPeriodValue(event.target.value)}
                  placeholder="%"
                />
                <button type="button" className="button-ghost" onClick={handleAddPeriod}>
                  Добавить
                </button>
              </div>
            </header>
            {Object.keys(periodDiscounts).length ? (
              <div className="grid gap-2 text-sm text-textMuted md:grid-cols-2">
                {Object.entries(periodDiscounts)
                  .sort(([a], [b]) => Number(a) - Number(b))
                  .map(([months, discount]) => (
                    <div key={months} className="flex items-center justify-between rounded-2xl border border-outline/40 bg-surfaceMuted/40 px-3 py-2">
                      <span>
                        {months} мес · {discount}%
                      </span>
                      <button type="button" className="text-xs text-danger" onClick={() => handleRemovePeriod(Number(months))}>
                        Удалить
                      </button>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-xs text-textMuted">Скидки по длительности не заданы.</p>
            )}
          </section>

          <footer className="flex items-center justify-end gap-3">
            <button type="button" className="button-ghost" onClick={onClose} disabled={isSubmitting}>
              Отмена
            </button>
            <button type="submit" className="button-primary" disabled={isSubmitting}>
              {isEdit ? "Сохранить" : "Создать"}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}


