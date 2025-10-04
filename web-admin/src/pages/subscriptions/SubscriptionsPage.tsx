import { useCallback, useMemo } from "react";
import { Activity, Clock3, CreditCard, Users } from "lucide-react";
import { useAddDevices, useAddTraffic, useExtendSubscription, useSubscriptionsList } from "@/features/subscriptions/queries";
import { useUserDetails } from "@/features/users/queries";
import type { SubscriptionListItem } from "@/features/subscriptions/api";
import { AnimatedNumber } from "@/components/shared/AnimatedNumber";

const PAGE_SIZE = 25;

export function SubscriptionsPage() {
  const { data, params, setParams, isLoading, isFetching } = useSubscriptionsList({ limit: PAGE_SIZE, offset: 0 });
  const items = data?.items ?? [];
  const extendMutation = useExtendSubscription();
  const addTrafficMutation = useAddTraffic();
  const addDevicesMutation = useAddDevices();

  const canPrev = (params as any).offset > 0;
  const canNext = data ? ((params as any).offset ?? 0) + ((params as any).limit ?? PAGE_SIZE) < data.total : false;

  const meta = useMemo(() => {
    if (!data) return "";
    const start = (data.offset ?? 0) + 1;
    const end = Math.min((data.offset ?? 0) + (data.limit ?? PAGE_SIZE), data.total);
    return `${start}–${end} из ${data.total}`;
  }, [data]);

  const handleFiltersChange = useCallback((filters: Record<string, unknown>) => {
    setParams((prev: any) => ({ ...prev, ...filters, offset: 0 }));
  }, [setParams]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-white">Подписки</h1>
        <p className="text-sm text-textMuted">Список подписок, статусы, трафик, устройства и автоплатежи.</p>
      </div>

      <SubscriptionsFilters onChange={handleFiltersChange} />

      <SubscriptionsSummary items={items} isLoading={isLoading || isFetching} />

      <SubscriptionsTable
        items={items}
        isLoading={isLoading || isFetching}
        onExtend={(id, days) => extendMutation.mutate({ id, days })}
        onAddTraffic={(id, gb) => addTrafficMutation.mutate({ id, gigabytes: gb })}
        onAddDevices={(id, n) => addDevicesMutation.mutate({ id, devices: n })}
      />

      <div className="flex items-center justify-between rounded-2xl border border-outline/40 bg-surfaceMuted/40 px-4 py-3 text-sm text-textMuted">
        <span>{meta}</span>
        <div className="flex items-center gap-2">
          <button type="button" className="button-ghost" disabled={!canPrev} onClick={() => setParams((prev: any) => ({ ...prev, offset: Math.max((prev.offset ?? 0) - (prev.limit ?? PAGE_SIZE), 0) }))}>Назад</button>
          <button type="button" className="button-primary" disabled={!canNext} onClick={() => setParams((prev: any) => ({ ...prev, offset: (prev.offset ?? 0) + (prev.limit ?? PAGE_SIZE) }))}>Далее</button>
        </div>
      </div>
    </div>
  );
}

function SubscriptionsFilters({ onChange }: { onChange: (filters: Record<string, unknown>) => void }) {
  return (
    <div className="grid gap-3 rounded-3xl border border-outline/40 bg-surfaceMuted/40 p-4 md:grid-cols-3 xl:grid-cols-6">
      <input className="rounded-2xl border border-outline/40 bg-surface/60 px-3 py-2 text-sm text-slate-100 placeholder:text-textMuted focus:border-primary/70 focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="ID пользователя" onChange={(e) => onChange({ user_id: e.target.value ? Number(e.target.value) : undefined })} />
      <select className="rounded-2xl border border-outline/40 bg-surface/70 px-3 py-2 text-sm text-white focus:border-primary/70 focus:outline-none focus:ring-2 focus:ring-primary/30" onChange={(e) => onChange({ status: e.target.value || undefined })}>
        <option value="">Все статусы</option>
        <option value="active">Активна</option>
        <option value="trial">Триал</option>
        <option value="expired">Просрочена</option>
        <option value="paused">Пауза</option>
      </select>
      <select className="rounded-2xl border border-outline/40 bg-surface/70 px-3 py-2 text-sm text-white focus:border-primary/70 focus:outline-none focus:ring-2 focus:ring-primary/30" onChange={(e) => onChange({ is_trial: e.target.value ? e.target.value === 'yes' : undefined })}>
        <option value="">Все типы</option>
        <option value="yes">Только триальные</option>
        <option value="no">Только платные</option>
      </select>
      <input type="date" className="rounded-2xl border border-outline/40 bg-surface/60 px-3 py-2 text-sm text-textMuted focus:border-primary/70 focus:outline-none focus:ring-2 focus:ring-primary/30" onChange={(e) => onChange({ date_from: e.target.value || undefined })} />
      <input type="date" className="rounded-2xl border border-outline/40 bg-surface/60 px-3 py-2 text-sm text-textMuted focus:border-primary/70 focus:outline-none focus:ring-2 focus:ring-primary/30" onChange={(e) => onChange({ date_to: e.target.value || undefined })} />
    </div>
  );
}

function SubscriptionsSummary({ items, isLoading }: { items: SubscriptionListItem[]; isLoading?: boolean }) {
  const active = items.filter((s) => s.status === "active").length;
  const trial = items.filter((s) => s.is_trial).length;
  const paused = items.filter((s) => s.status === "paused").length;
  const expired = items.filter((s) => s.status === "expired").length;

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <SummaryCard icon={<Users className="h-4 w-4 text-sky" />} title="Активные" value={<AnimatedNumber value={active} />} />
      <SummaryCard icon={<Clock3 className="h-4 w-4 text-warning" />} title="Триал" value={<AnimatedNumber value={trial} />} />
      <SummaryCard icon={<Activity className="h-4 w-4 text-primary" />} title="Пауза" value={<AnimatedNumber value={paused} />} />
      <SummaryCard icon={<CreditCard className="h-4 w-4 text-danger" />} title="Просрочено" value={<AnimatedNumber value={expired} />} />
    </div>
  );
}

function SummaryCard({ icon, title, value }: { icon: React.ReactNode; title: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-outline/40 bg-surfaceMuted/40 p-3">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface/60">{icon}</span>
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-[0.28em] text-textMuted/70">{title}</p>
        <div className="truncate text-sm font-semibold text-white">{value}</div>
      </div>
    </div>
  );
}

function SubscriptionsTable({ items, isLoading, onExtend, onAddTraffic, onAddDevices }: { items: SubscriptionListItem[]; isLoading?: boolean; onExtend: (id: number, days: number) => void; onAddTraffic: (id: number, gb: number) => void; onAddDevices: (id: number, n: number) => void }) {
  if (isLoading) {
    return <div className="rounded-3xl border border-outline/40 bg-surface/60 p-8 text-center text-textMuted">Загрузка…</div>;
  }
  if (!items.length) {
    return <div className="rounded-3xl border border-outline/40 bg-surface/60 p-8 text-center text-textMuted">Подписки не найдены.</div>;
  }
  return (
    <div className="overflow-hidden rounded-3xl border border-outline/40">
      <table className="min-w-full divide-y divide-outline/40 bg-surface/80 text-sm">
        <thead className="bg-surfaceMuted/40 text-xs uppercase tracking-[0.28em] text-textMuted">
          <tr>
            <th className="px-4 py-3 text-left">ID</th>
            <th className="px-4 py-3 text-left">Пользователь</th>
            <th className="px-4 py-3 text-left">Статус</th>
            <th className="px-4 py-3 text-left">Период</th>
            <th className="px-4 py-3 text-left">Трафик</th>
            <th className="px-4 py-3 text-left">Устройства</th>
            <th className="px-4 py-3 text-left">Autopay</th>
            <th className="px-4 py-3 text-left">Действия</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-outline/40">
          {items.map((s) => (
            <tr key={s.id} className="bg-surface/60">
              <td className="px-4 py-3 font-medium text-slate-100">{s.id}</td>
              <td className="px-4 py-3 text-slate-100"><UserCell userId={s.user_id} fallbackUsername={s.username} fallbackTelegramId={s.telegram_id} /></td>
              <td className="px-4 py-3 text-textMuted">{s.status}{s.is_trial ? " · триал" : ""}</td>
              <td className="px-4 py-3 text-textMuted">{formatDate(s.start_date)} — {formatDate(s.end_date)}</td>
              <td className="px-4 py-3 text-textMuted">{s.traffic_used_gb} / {s.traffic_limit_gb} ГБ</td>
              <td className="px-4 py-3 text-textMuted">{s.device_limit}</td>
              <td className="px-4 py-3 text-textMuted">{s.autopay_enabled ? `за ${s.autopay_days_before} дней` : "—"}</td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <button className="rounded-xl border border-outline/40 bg-surface/60 px-3 py-1 text-xs text-textMuted hover:text-white" onClick={() => onExtend(s.id, 30)}>+30 дней</button>
                  <button className="rounded-xl border border-outline/40 bg-surface/60 px-3 py-1 text-xs text-textMuted hover:text-white" onClick={() => onExtend(s.id, 90)}>+90 дней</button>
                  <button className="rounded-xl border border-outline/40 bg-surface/60 px-3 py-1 text-xs text-textMuted hover:text-white" onClick={() => onAddTraffic(s.id, 10)}>+10 ГБ</button>
                  <button className="rounded-xl border border-outline/40 bg-surface/60 px-3 py-1 text-xs text-textMuted hover:text-white" onClick={() => onAddDevices(s.id, 1)}>+1 устройство</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  return `${date.toLocaleDateString("ru-RU")} ${date.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}`;
}

function UserCell({ userId, fallbackUsername, fallbackTelegramId }: { userId: number; fallbackUsername?: string | null; fallbackTelegramId?: number }) {
  const query = useUserDetails(userId);
  if (query.isLoading) {
    const username = fallbackUsername ? `@${fallbackUsername}` : "—";
    return (
      <span className="inline-flex items-center gap-2 text-xs text-textMuted">
        <span className="h-2 w-2 animate-pulse rounded-full bg-primary/60" /> {username} {fallbackTelegramId ? <span className="text-textMuted">(tg: {fallbackTelegramId})</span> : null}
      </span>
    );
  }
  if (query.isError || !query.data) {
    const username = fallbackUsername ? `@${fallbackUsername}` : `ID: ${userId}`;
    return <span className="text-textMuted">{username}</span>;
  }
  const user = query.data;
  const username = user.username ? `@${user.username}` : `ID: ${userId}`;
  return (
    <span className="text-slate-100">
      {username} <span className="text-textMuted">(tg: {user.telegram_id})</span>
    </span>
  );
}


