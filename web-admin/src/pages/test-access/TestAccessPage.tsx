import { useMemo, useState } from "react";
import { Clock, Filter, RefreshCw, X, Zap, ShieldOff } from "lucide-react";
import clsx from "clsx";
import {
  useDeactivateTestAccess,
  useExtendTestAccess,
  useTestAccessList,
  useTestAccessSquads,
} from "@/features/test-access/queries";
import type { TestAccessEntry, TestAccessQuery, TestAccessSquad } from "@/features/test-access/api";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";

const STORAGE_KEY = "promo-test-access:list";

export default function TestAccessPage() {
  const { data, params, setParams, isLoading, isFetching } = useTestAccessList({ limit: 25, offset: 0 }, { storageKey: STORAGE_KEY });
  const extendMutation = useExtendTestAccess();
  const deactivateMutation = useDeactivateTestAccess();
  const [extendTarget, setExtendTarget] = useState<TestAccessEntry | null>(null);
  const [showSquads, setShowSquads] = useState(false);
  const { data: squadsData } = useTestAccessSquads({ available_only: true, limit: 200 });

  const filtersActive = Boolean(
    typeof params.is_active === "boolean" ||
      params.user_id ||
      params.offer_id ||
      params.squad_uuid,
  );

  const stats = useMemo(() => {
    const items = data?.items ?? [];
    const total = data?.total ?? 0;
    const active = items.filter((item) => item.is_active).length;
    const inactive = items.filter((item) => !item.is_active).length;
    const expiringSoon = items.filter((item) => item.is_active && isExpiringSoon(item.expires_at)).length;
    return { total, active, inactive, expiringSoon };
  }, [data]);

  const handleFilterChange = (partial: Partial<TestAccessQuery>) => {
    setParams((prev) => ({ ...prev, ...partial, offset: 0 }));
  };

  const handleResetFilters = () => {
    setParams({ limit: params.limit ?? 25, offset: 0, is_active: true });
  };

  const handlePrev = () => {
    setParams((prev) => ({
      ...prev,
      offset: Math.max(0, (prev.offset ?? 0) - (prev.limit ?? 25)),
    }));
  };

  const handleNext = () => {
    setParams((prev) => ({
      ...prev,
      offset: (prev.offset ?? 0) + (prev.limit ?? 25),
    }));
  };

  const canPrev = (params.offset ?? 0) > 0;
  const canNext = data ? (params.offset ?? 0) + (params.limit ?? 25) < data.total : false;

  const meta = useMemo(() => {
    if (!data) return "";
    const start = (data.offset ?? 0) + 1;
    const end = Math.min((data.offset ?? 0) + (data.limit ?? 25), data.total);
    return `${start}–${end} из ${data.total}`;
  }, [data]);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Тестовые доступы</h1>
          <p className="text-sm text-textMuted">Управление временными подключениями к RemnaWave, продление и отключение.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="button-ghost inline-flex items-center gap-2"
            onClick={() => setParams((prev) => ({ ...prev }))}
          >
            <RefreshCw className="h-4 w-4" /> Обновить
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl bg-primary/20 px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/30"
            onClick={() => setShowSquads((value) => !value)}
          >
            <Zap className="h-4 w-4" /> {showSquads ? "Скрыть сквады" : "Справочник сквадов"}
          </button>
        </div>
      </header>

      <StatsRow stats={stats} isLoading={isLoading || isFetching} />

      <FiltersPanel
        params={params}
        filtersActive={filtersActive}
        onChange={handleFilterChange}
        onReset={handleResetFilters}
      />

      {showSquads ? <SquadsPanel squads={squadsData?.items ?? []} /> : null}

      <TestAccessTable
        items={data?.items ?? []}
        meta={meta}
        canPrev={canPrev}
        canNext={canNext}
        onPrev={handlePrev}
        onNext={handleNext}
        disabled={isLoading || isFetching || extendMutation.isPending || deactivateMutation.isPending}
        onExtend={(entry) => setExtendTarget(entry)}
        onDeactivate={async (entry) => {
          if (!entry.is_active) return;
          const confirm = window.confirm("Отключить тестовый доступ?");
          if (!confirm) return;
          try {
            await deactivateMutation.mutateAsync(entry.id);
          } catch (error) {
            // handled by toast interceptor
          }
        }}
        isLoading={isLoading || isFetching}
      />

      <ExtendDialog
        entry={extendTarget}
        onClose={() => setExtendTarget(null)}
        isSubmitting={extendMutation.isPending}
        onSubmit={async (entryId, payload) => {
          try {
            await extendMutation.mutateAsync({ id: entryId, payload });
            setExtendTarget(null);
          } catch (error) {
            // handled globally
          }
        }}
      />
    </div>
  );
}

function StatsRow({ stats, isLoading }: { stats: { total: number; active: number; inactive: number; expiringSoon: number }; isLoading: boolean }) {
  const cards = [
    { label: "Всего", value: stats.total, tone: "bg-outline/40" },
    { label: "Активно", value: stats.active, tone: "bg-success/15 text-success" },
    { label: "Неактивно", value: stats.inactive, tone: "bg-outline/40" },
    { label: "Истекают < 24ч", value: stats.expiringSoon, tone: "bg-warning/15 text-warning" },
  ];
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <div key={card.label} className={clsx("rounded-3xl border border-outline/40 bg-surface/60 p-4", isLoading && "opacity-60")}>
          <div className="text-xs uppercase tracking-[0.28em] text-textMuted">{card.label}</div>
          <div className={clsx("mt-3 text-2xl font-semibold text-white", card.tone?.includes("text") ? card.tone.split(" ").find((t) => t.startsWith("text-")) : undefined)}>
            {formatInt(card.value)}
          </div>
        </div>
      ))}
    </div>
  );
}

function FiltersPanel({
  params,
  filtersActive,
  onChange,
  onReset,
}: {
  params: TestAccessQuery;
  filtersActive: boolean;
  onChange: (partial: Partial<TestAccessQuery>) => void;
  onReset: () => void;
}) {
  const statusValue = typeof params.is_active === "boolean" ? (params.is_active ? "active" : "inactive") : "all";

  return (
    <div className="rounded-3xl border border-outline/40 bg-surface/60 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-white">
          <Filter className="h-4 w-4" />
          <span>Фильтры</span>
        </div>
        <button
          type="button"
          className="button-ghost inline-flex items-center gap-2 disabled:opacity-40"
          onClick={onReset}
          disabled={!filtersActive}
        >
          <X className="h-4 w-4" /> Сбросить
        </button>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-4">
        <label className="flex flex-col gap-2">
          <span className="text-xs uppercase tracking-[0.28em] text-textMuted">ID пользователя</span>
          <input
            className="rounded-xl border border-outline/40 bg-surface/70 px-3 py-2 text-sm text-white"
            inputMode="numeric"
            value={params.user_id ?? ""}
            onChange={(event) => onChange({ user_id: event.target.value ? Number(event.target.value) : undefined })}
            placeholder="Внутренний ID или Telegram ID"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-xs uppercase tracking-[0.28em] text-textMuted">ID оффера</span>
          <input
            className="rounded-xl border border-outline/40 bg-surface/70 px-3 py-2 text-sm text-white"
            inputMode="numeric"
            value={params.offer_id ?? ""}
            onChange={(event) => onChange({ offer_id: event.target.value ? Number(event.target.value) : undefined })}
            placeholder="ID DiscountOffer"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-xs uppercase tracking-[0.28em] text-textMuted">UUID сквада</span>
          <input
            className="rounded-xl border border-outline/40 bg-surface/70 px-3 py-2 text-sm text-white"
            value={params.squad_uuid ?? ""}
            onChange={(event) => onChange({ squad_uuid: event.target.value || undefined })}
            placeholder="xxxxxxxx-xxxx-xxxx"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-xs uppercase tracking-[0.28em] text-textMuted">Статус</span>
          <select
            className="rounded-xl border border-outline/40 bg-surface/70 px-3 py-2 text-sm text-white"
            value={statusValue}
            onChange={(event) => {
              const value = event.target.value;
              if (value === "active") onChange({ is_active: true });
              else if (value === "inactive") onChange({ is_active: false });
              else onChange({ is_active: null });
            }}
          >
            <option value="all">Все</option>
            <option value="active">Активные</option>
            <option value="inactive">Отключённые</option>
          </select>
        </label>
      </div>
    </div>
  );
}

function TestAccessTable({
  items,
  meta,
  canPrev,
  canNext,
  onPrev,
  onNext,
  disabled,
  onExtend,
  onDeactivate,
  isLoading,
}: {
  items: TestAccessEntry[];
  meta: string;
  canPrev: boolean;
  canNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  disabled: boolean;
  onExtend: (entry: TestAccessEntry) => void;
  onDeactivate: (entry: TestAccessEntry) => void;
  isLoading: boolean;
}) {
  if (isLoading) {
    return <div className="rounded-3xl border border-outline/40 bg-surface/60 p-8 text-center text-textMuted">Загрузка…</div>;
  }

  if (!items.length) {
    return <div className="rounded-3xl border border-outline/40 bg-surface/60 p-8 text-center text-textMuted">Активных тестовых доступов нет.</div>;
  }

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-3xl border border-outline/40">
        <table className="min-w-full divide-y divide-outline/40 bg-surface/80 text-sm">
          <thead className="bg-surfaceMuted/40 text-xs uppercase tracking-[0.28em] text-textMuted">
            <tr>
              <th className="px-4 py-3 text-left">Пользователь</th>
              <th className="px-4 py-3 text-left">Оффер</th>
              <th className="px-4 py-3 text-left">Сквад</th>
              <th className="px-4 py-3 text-left">Срок</th>
              <th className="px-4 py-3 text-left">Статус</th>
              <th className="px-4 py-3 text-left">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline/40">
            {items.map((item) => (
              <tr key={item.id} className="bg-surface/60">
                <td className="px-4 py-3">
                  <div className="flex flex-col">
                    <span className="font-medium text-white">{item.user?.username ? `@${item.user.username}` : `#${item.user?.id ?? "—"}`}</span>
                    <span className="text-xs text-textMuted">ID: {item.user?.id ?? "—"}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-textMuted">
                  <div className="flex flex-col">
                    <span>{item.offer?.notification_type ?? "—"}</span>
                    <span className="text-xs text-textMuted/70">{item.offer?.effect_type ?? ""}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-textMuted">
                  <div className="flex flex-col">
                    <span>{item.squad?.display_name ?? "Неизвестно"}</span>
                    <span className="text-xs text-textMuted/70">{item.squad_uuid}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-textMuted">
                  <div className="flex flex-col">
                    <span>{formatDateTime(item.expires_at)}</span>
                    {item.is_active ? (
                      <span className="text-xs text-textMuted/70">{formatDistance(item.expires_at)}</span>
                    ) : (
                      <span className="text-xs text-textMuted/70">Отключён {item.deactivated_at ? formatDateTime(item.deactivated_at) : ""}</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge entry={item} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="rounded-xl border border-outline/40 bg-primary/15 px-3 py-1 text-xs text-primary hover:bg-primary/25 disabled:opacity-40"
                      onClick={() => onExtend(item)}
                      disabled={disabled}
                    >
                      Продлить
                    </button>
                    <button
                      type="button"
                      className="rounded-xl border border-outline/40 bg-danger/15 px-3 py-1 text-xs text-danger hover:bg-danger/25 disabled:opacity-40"
                      onClick={() => onDeactivate(item)}
                      disabled={disabled || !item.is_active}
                    >
                      Отключить
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 rounded-3xl border border-outline/40 bg-surface/60 px-4 py-3 text-sm text-textMuted md:flex-row md:items-center md:justify-between">
        <span>{meta || "Нет данных"}</span>
        <div className="flex items-center gap-2">
          <button className="button-ghost inline-flex items-center gap-2 disabled:opacity-40" onClick={onPrev} disabled={!canPrev || disabled}>
            Назад
          </button>
          <button className="button-ghost inline-flex items-center gap-2 disabled:opacity-40" onClick={onNext} disabled={!canNext || disabled}>
            Далее
          </button>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ entry }: { entry: TestAccessEntry }) {
  if (!entry.is_active) {
    return (
      <span className="inline-flex items-center gap-2 rounded-full bg-outline/30 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-textMuted">
        <ShieldOff className="h-3.5 w-3.5" /> Отключено
      </span>
    );
  }
  const nearing = isExpiringSoon(entry.expires_at);
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide",
        nearing ? "bg-warning/15 text-warning" : "bg-primary/15 text-primary",
      )}
    >
      <Clock className="h-3.5 w-3.5" /> Активно
    </span>
  );
}

function SquadsPanel({ squads }: { squads: TestAccessSquad[] }) {
  if (!squads.length) {
    return (
      <div className="rounded-3xl border border-outline/40 bg-surface/60 p-4 text-sm text-textMuted">
        Справочник сквадов пуст. Убедитесь, что данные синхронизированы.
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-outline/40 bg-surface/60 p-4">
      <h2 className="text-sm font-semibold text-white">Доступные сквады</h2>
      <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {squads.map((squad) => (
          <div key={squad.id} className="rounded-2xl border border-outline/30 bg-surface/70 px-4 py-3 text-sm text-textMuted">
            <div className="font-medium text-white">{squad.display_name}</div>
            <div className="text-xs text-textMuted/70">{squad.squad_uuid}</div>
            <div className="mt-2 text-xs text-textMuted/60">
              {squad.country_code ? `Страна: ${squad.country_code}` : null}
              {typeof squad.is_available === "boolean" ? ` • ${squad.is_available ? "Доступен" : "Недоступен"}` : null}
            </div>
            {squad.price_kopeks ? (
              <div className="mt-1 text-xs text-textMuted/70">Стоимость: {(squad.price_kopeks / 100).toFixed(2)} ₽</div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

function ExtendDialog({
  entry,
  onClose,
  isSubmitting,
  onSubmit,
}: {
  entry: TestAccessEntry | null;
  onClose: () => void;
  isSubmitting: boolean;
  onSubmit: (entryId: number, payload: { extend_hours?: number; expires_at?: string }) => Promise<void>;
}) {
  const [extendHours, setExtendHours] = useState<string>("");
  const [expiresAt, setExpiresAt] = useState<string>("");

  if (!entry) return null;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const payload: { extend_hours?: number; expires_at?: string } = {};
    if (extendHours) payload.extend_hours = Number(extendHours);
    if (expiresAt) payload.expires_at = new Date(expiresAt).toISOString();
    if (!payload.extend_hours && !payload.expires_at) {
      alert("Укажите количество часов или новую дату окончания.");
      return;
    }
    await onSubmit(entry.id, payload);
    setExtendHours("");
    setExpiresAt("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="relative w-full max-w-md rounded-3xl border border-outline/40 bg-surface/95 p-6 shadow-card">
        <header className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white">Продлить тестовый доступ</h2>
            <p className="text-xs text-textMuted">Для {entry.user?.username ? `@${entry.user.username}` : `пользователя #${entry.user?.id ?? entry.id}`}</p>
          </div>
          <button className="button-ghost p-2" onClick={onClose}>
            <X className="h-4 w-4" />
          </button>
        </header>

        <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
          <p className="text-xs text-textMuted">Укажите, на сколько продлить доступ или установите точную дату окончания.</p>

          <label className="flex flex-col gap-2">
            <span className="text-xs uppercase tracking-[0.28em] text-textMuted">Добавить часов</span>
            <input
              type="number"
              min={1}
              max={168}
              className="rounded-xl border border-outline/40 bg-surface/70 px-3 py-2 text-sm text-white"
              value={extendHours}
              onChange={(event) => setExtendHours(event.target.value)}
              placeholder="Например, 24"
              disabled={Boolean(expiresAt)}
            />
          </label>

          <div className="text-center text-xs uppercase tracking-[0.28em] text-textMuted">или</div>

          <label className="flex flex-col gap-2">
            <span className="text-xs uppercase tracking-[0.28em] text-textMuted">Новая дата окончания</span>
            <input
              type="datetime-local"
              className="rounded-xl border border-outline/40 bg-surface/70 px-3 py-2 text-sm text-white"
              value={expiresAt}
              onChange={(event) => setExpiresAt(event.target.value)}
              disabled={Boolean(extendHours)}
            />
          </label>

          <footer className="flex items-center justify-end gap-2">
            <button type="button" className="button-ghost inline-flex items-center gap-2" onClick={onClose} disabled={isSubmitting}>
              Отмена
            </button>
            <button type="submit" className="button-primary inline-flex items-center gap-2" disabled={isSubmitting}>
              Продлить
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}

function isExpiringSoon(expiresAt: string): boolean {
  const expires = new Date(expiresAt).getTime();
  const now = Date.now();
  return expires - now <= 24 * 60 * 60 * 1000 && expires > now;
}

function formatDateTime(value?: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleString("ru-RU");
}

function formatDistance(value: string): string {
  const date = new Date(value);
  return formatDistanceToNow(date, { locale: ru, addSuffix: true });
}

function formatInt(value: number): string {
  return new Intl.NumberFormat("ru-RU").format(value);
}
