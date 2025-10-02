import { useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Check, Loader2, PencilLine, X } from "lucide-react";
import type { User } from "@/types/users";
import { UserStatusBadge } from "@/components/users/UserStatusBadge";
import { useAdjustUserBalance, useUpdateUser } from "@/features/users/queries";
import { AnimatedNumber } from "@/components/shared/AnimatedNumber";

const STATUS_OPTIONS = [
  { value: "new", label: "Новый" },
  { value: "trial", label: "Триал" },
  { value: "active", label: "Активен" },
  { value: "paused", label: "Пауза" },
  { value: "blocked", label: "Блокирован" },
  { value: "archived", label: "Архив" },
];

function formatDate(value?: string | null) {
  if (!value) return "—";
  return format(new Date(value), "d MMM yyyy HH:mm", { locale: ru });
}

interface UserDetailsDrawerProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
}

export function UserDetailsDrawer({ user, isOpen, onClose }: UserDetailsDrawerProps) {
  // Return early BEFORE any hooks to keep hook order stable across renders
  if (!isOpen || !user) {
    return null;
  }

  const [visible, setVisible] = useState(false);
  useEffect(() => {
    setVisible(true);
  }, []);
  const requestClose = () => {
    setVisible(false);
    window.setTimeout(onClose, 200);
  };

  const [status, setStatus] = useState<string>(user.status ?? "");
  const [balanceInput, setBalanceInput] = useState<string>("");
  const [balanceDescription, setBalanceDescription] = useState<string>("");
  const [draft, setDraft] = useState<{
    username: string;
    first_name: string;
    last_name: string;
    language: string;
    referral_code: string;
    status: string;
  }>({
    username: user.username ?? "",
    first_name: user.first_name ?? "",
    last_name: user.last_name ?? "",
    language: user.language ?? "ru",
    referral_code: user.referral_code ?? "",
    status: user.status ?? "new",
  });

  const updateMutation = useUpdateUser(user?.id ?? null);
  const balanceMutation = useAdjustUserBalance(user?.id ?? null);

  useEffect(() => {
    setStatus(user?.status ?? "");
  }, [user?.status]);

  useEffect(() => {
    setDraft({
      username: user.username ?? "",
      first_name: user.first_name ?? "",
      last_name: user.last_name ?? "",
      language: user.language ?? "ru",
      referral_code: user.referral_code ?? "",
      status: user.status ?? "new",
    });
  }, [user]);

  //

  const handleStatusSave = () => {
    if (!status || status === user.status) {
      return;
    }
    updateMutation.mutate({ status });
  };

  const isDirty = useMemo(() => {
    if (!user) return false;
    return (
      draft.username !== (user.username ?? "") ||
      draft.first_name !== (user.first_name ?? "") ||
      draft.last_name !== (user.last_name ?? "") ||
      draft.language !== (user.language ?? "ru") ||
      draft.referral_code !== (user.referral_code ?? "") ||
      draft.status !== (user.status ?? "new")
    );
  }, [draft, user]);

  const handleSaveAll = () => {
    if (!user || !isDirty) return;
    const payload: Record<string, unknown> = {};
    if (draft.username !== (user.username ?? "")) payload.username = draft.username || null;
    if (draft.first_name !== (user.first_name ?? "")) payload.first_name = draft.first_name || null;
    if (draft.last_name !== (user.last_name ?? "")) payload.last_name = draft.last_name || null;
    if (draft.language !== (user.language ?? "ru")) payload.language = draft.language || null;
    if (draft.referral_code !== (user.referral_code ?? "")) payload.referral_code = draft.referral_code || null;
    if (draft.status !== (user.status ?? "new")) payload.status = draft.status || null;
    updateMutation.mutate(payload as any);
  };

  const handleReset = () => {
    if (!user) return;
    setDraft({
      username: user.username ?? "",
      first_name: user.first_name ?? "",
      last_name: user.last_name ?? "",
      language: user.language ?? "ru",
      referral_code: user.referral_code ?? "",
      status: user.status ?? "new",
    });
  };

  const handleBalanceChange = () => {
    const amount = Number(balanceInput.replace(",", "."));
    if (!Number.isFinite(amount) || amount === 0) {
      return;
    }
    balanceMutation.mutate(
      {
        amount_rubles: amount,
        description: balanceDescription || undefined,
      },
      {
        onSuccess: () => {
          setBalanceInput("");
          setBalanceDescription("");
        },
      },
    );
  };

  const isUpdating = updateMutation.isPending || balanceMutation.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className={clsx(
          "absolute inset-0 bg-black/60 transition-opacity duration-200",
          visible ? "opacity-100" : "opacity-0",
        )}
        onClick={requestClose}
      />
      <div
        className={clsx(
          "relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-outline/50 bg-surface/90 p-6 sm:p-8 shadow-card transition-all duration-200",
          visible ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 -translate-y-2",
        )}
      >
        <button className="absolute right-6 top-6 rounded-full bg-surfaceMuted/60 p-2 text-textMuted hover:text-slate-100" onClick={requestClose}>
          <X className="h-5 w-5" />
        </button>

        <header className="pr-10">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/30 to-sky/20 text-xl font-semibold text-white">
                {String(user.first_name || user.username || "U").slice(0, 1).toUpperCase()}
              </div>
              <div>
          <p className="text-xs uppercase tracking-[0.32em] text-textMuted/70">Профиль пользователя</p>
                <h2 className="mt-1 text-2xl font-semibold text-white">{user.first_name || user.username || user.telegram_id}</h2>
          <p className="text-sm text-textMuted">ID: {user.id} · Telegram ID: {user.telegram_id}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <UserStatusBadge status={user.status} />
              <button
                className="inline-flex items-center gap-2 rounded-xl border border-outline/40 bg-surfaceMuted/60 px-3 py-2 text-sm text-textMuted hover:text-white"
                onClick={() => setDraft((d) => ({ ...d, status: user.status }))}
              >
                <PencilLine className="h-4 w-4" />
                Изменить
              </button>
            </div>
          </div>
        </header>

        <div className="mt-6 space-y-6 overflow-y-auto pr-4">
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-white">Основная информация</h3>
            <div className="rounded-2xl border border-outline/40 bg-surfaceMuted/40 p-4 text-sm text-textMuted">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-2">
                  <span className="text-xs uppercase tracking-[0.28em] text-textMuted">Username</span>
                  <input
                    className="rounded-2xl border border-outline/40 bg-surface/60 px-3 py-2 text-sm text-slate-100 placeholder:text-textMuted focus:border-primary/70 focus:outline-none focus:ring-2 focus:ring-primary/40"
                    placeholder="@username"
                    value={draft.username}
                    onChange={(e) => setDraft((d) => ({ ...d, username: e.target.value.replace(/^@/, "") }))}
                  />
                </label>
                <label className="flex flex-col gap-2">
                  <span className="text-xs uppercase tracking-[0.28em] text-textMuted">Имя</span>
                  <input
                    className="rounded-2xl border border-outline/40 bg-surface/60 px-3 py-2 text-sm text-slate-100 placeholder:text-textMuted focus:border-primary/70 focus:outline-none focus:ring-2 focus:ring-primary/40"
                    placeholder="Имя"
                    value={draft.first_name}
                    onChange={(e) => setDraft((d) => ({ ...d, first_name: e.target.value }))}
                  />
                </label>
                <label className="flex flex-col gap-2">
                  <span className="text-xs uppercase tracking-[0.28em] text-textMuted">Фамилия</span>
                  <input
                    className="rounded-2xl border border-outline/40 bg-surface/60 px-3 py-2 text-sm text-slate-100 placeholder:text-textMuted focus:border-primary/70 focus:outline-none focus:ring-2 focus:ring-primary/40"
                    placeholder="Фамилия"
                    value={draft.last_name}
                    onChange={(e) => setDraft((d) => ({ ...d, last_name: e.target.value }))}
                  />
                </label>
                <label className="flex flex-col gap-2">
                  <span className="text-xs uppercase tracking-[0.28em] text-textMuted">Язык</span>
                  <select
                    className="rounded-2xl border border-outline/40 bg-surface/70 px-3 py-2 text-sm text-white focus:border-primary/70 focus:outline-none focus:ring-2 focus:ring-primary/40"
                    value={draft.language}
                    onChange={(e) => setDraft((d) => ({ ...d, language: e.target.value }))}
                  >
                    <option value="ru">Русский</option>
                    <option value="en">English</option>
                  </select>
                </label>
                <label className="flex flex-col gap-2">
                  <span className="text-xs uppercase tracking-[0.28em] text-textMuted">Реферальный код</span>
                  <input
                    className="rounded-2xl border border-outline/40 bg-surface/60 px-3 py-2 text-sm text-slate-100 placeholder:text-textMuted focus:border-primary/70 focus:outline-none focus:ring-2 focus:ring-primary/40"
                    placeholder="Код"
                    value={draft.referral_code}
                    onChange={(e) => setDraft((d) => ({ ...d, referral_code: e.target.value }))}
                  />
                </label>
                <div className="flex flex-col gap-2">
                  <span className="text-xs uppercase tracking-[0.28em] text-textMuted">Промо-группа</span>
                  <div className="rounded-2xl border border-outline/40 bg-surface/60 px-3 py-2 text-sm text-textMuted">
                    {user.promo_group?.name || "—"}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-xs uppercase tracking-[0.28em] text-textMuted">Создан</span>
                  <div className="rounded-2xl border border-outline/40 bg-surface/60 px-3 py-2 text-sm text-textMuted">{formatDate(user.created_at)}</div>
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-xs uppercase tracking-[0.28em] text-textMuted">Активность</span>
                  <div className="rounded-2xl border border-outline/40 bg-surface/60 px-3 py-2 text-sm text-textMuted">{formatDate(user.last_activity)}</div>
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-white">Статус</h3>
            <div className="rounded-2xl border border-outline/40 bg-surfaceMuted/40 p-4 text-sm text-textMuted">
              <div className="flex flex-wrap items-center gap-2">
                  {STATUS_OPTIONS.map((option) => (
                <button
                    key={option.value}
                    type="button"
                    className={`inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs ${
                      draft.status === option.value
                        ? "border-primary/50 bg-primary/20 text-white"
                        : "border-outline/40 bg-surface/60 text-textMuted hover:text-white"
                    }`}
                    onClick={() => setDraft((d) => ({ ...d, status: option.value }))}
                  >
                    {draft.status === option.value ? <Check className="h-3.5 w-3.5" /> : null}
                    {option.label}
                </button>
                ))}
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-white">Баланс</h3>
            <div className="rounded-2xl border border-outline/40 bg-surfaceMuted/40 p-4 text-sm text-textMuted">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-textMuted">Текущий баланс</p>
                  <p className={`mt-1 text-lg font-semibold ${user.balance_rubles < 0 ? "text-danger" : "text-white"}`}>
                    <AnimatedNumber value={user.balance_rubles} format={(n) => `${(Math.round(n * 100) / 100).toFixed(2)} ₽`} />
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {[100, 500, 1000].map((val) => (
                    <button key={val} className="rounded-xl border border-outline/40 bg-surface/60 px-3 py-1 text-xs text-textMuted hover:text-white" onClick={() => setBalanceInput(String(val))}>+{val}</button>
                  ))}
                  {[-100, -500].map((val) => (
                    <button key={val} className="rounded-xl border border-outline/40 bg-surface/60 px-3 py-1 text-xs text-textMuted hover:text-white" onClick={() => setBalanceInput(String(val))}>{val}</button>
                  ))}
                </div>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className="flex flex-col gap-2">
                  <span className="text-xs uppercase tracking-[0.28em] text-textMuted">Сумма, ₽</span>
                  <input
                    className="rounded-2xl border border-outline/40 bg-surface/60 px-3 py-2 text-sm text-slate-100 placeholder:text-textMuted focus:border-primary/70 focus:outline-none focus:ring-2 focus:ring-primary/40"
                    value={balanceInput}
                    onChange={(event) => setBalanceInput(event.target.value)}
                    placeholder="Например, 250.00"
                  />
                </label>
                <label className="flex flex-col gap-2">
                  <span className="text-xs uppercase tracking-[0.28em] text-textMuted">Описание</span>
                  <input
                    className="rounded-2xl border border-outline/40 bg-surface/60 px-3 py-2 text-sm text-slate-100 placeholder:text-textMuted focus:border-primary/70 focus:outline-none focus:ring-2 focus:ring-primary/40"
                    value={balanceDescription}
                    onChange={(event) => setBalanceDescription(event.target.value)}
                    placeholder="Комментарий"
                  />
                </label>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <p className="text-xs text-textMuted">Положительное значение увеличит баланс, отрицательное — уменьшит.</p>
                <button className="button-primary" onClick={handleBalanceChange} disabled={balanceMutation.isPending}>
                  Применить
                </button>
              </div>
            </div>
          </section>

          {user.subscription ? (
            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-white">Подписка</h3>
              <div className="rounded-2xl border border-outline/40 bg-surfaceMuted/40 p-4 text-sm text-textMuted">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <InfoRow label="Статус" value={`${user.subscription.status} (${user.subscription.actual_status})`} />
                  <InfoRow label="Период" value={`${formatDate(user.subscription.start_date)} — ${formatDate(user.subscription.end_date)}`} />
                  <InfoRow label="Трафик" value={`${user.subscription.traffic_used_gb} / ${user.subscription.traffic_limit_gb} ГБ`} />
                  <InfoRow label="Устройства" value={`${user.subscription.device_limit}`} />
                  <InfoRow label="Autopay" value={user.subscription.autopay_enabled ? `за ${user.subscription.autopay_days_before} дней` : "выключен"} />
                  <InfoRow label="Сквады" value={user.subscription.connected_squads.join(", ") || "—"} />
                </div>
              </div>
            </section>
          ) : null}
        </div>

        <div className="sticky bottom-0 mt-4 -mx-8 border-t border-outline/40 bg-surface/90 px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="text-xs text-textMuted">{isDirty ? "Есть несохранённые изменения" : "Все изменения сохранены"}</div>
            <div className="flex items-center gap-2">
              <button className="button-ghost" onClick={handleReset} disabled={!isDirty || isUpdating}>Сбросить</button>
              <button className="button-primary" onClick={handleSaveAll} disabled={!isDirty || isUpdating}>
                {isUpdating ? <Loader2 className="mr-2 inline h-4 w-4 animate-spin" /> : null}
                Сохранить
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface InfoRowProps {
  label: string;
  value: string;
  highlight?: boolean;
}

function InfoRow({ label, value, highlight }: InfoRowProps) {
  return (
    <div className="flex flex-col">
      <span className="text-xs uppercase tracking-[0.28em] text-textMuted/70">{label}</span>
      <span className={highlight ? "text-danger" : "text-slate-100"}>{value}</span>
    </div>
  );
}
