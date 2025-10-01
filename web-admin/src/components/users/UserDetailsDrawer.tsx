import { useEffect, useState } from "react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Loader2, X } from "lucide-react";
import type { User } from "@/types/users";
import { UserStatusBadge } from "@/components/users/UserStatusBadge";
import { useAdjustUserBalance, useUpdateUser } from "@/features/users/queries";

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
  const [status, setStatus] = useState<string>(user?.status ?? "");
  const [balanceInput, setBalanceInput] = useState<string>("");
  const [balanceDescription, setBalanceDescription] = useState<string>("");

  const updateMutation = useUpdateUser(user?.id ?? null);
  const balanceMutation = useAdjustUserBalance(user?.id ?? null);

  useEffect(() => {
    setStatus(user?.status ?? "");
  }, [user?.status]);

  if (!isOpen || !user) {
    return null;
  }

  const handleStatusSave = () => {
    if (!status || status === user.status) {
      return;
    }
    updateMutation.mutate({ status });
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
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <aside className="relative ml-auto flex h-full w-full max-w-xl flex-col bg-surface/90 p-8 shadow-card">
        <button className="absolute right-6 top-6 rounded-full bg-surfaceMuted/60 p-2 text-textMuted hover:text-slate-100" onClick={onClose}>
          <X className="h-5 w-5" />
        </button>

        <header className="pr-10">
          <p className="text-xs uppercase tracking-[0.32em] text-textMuted/70">Профиль пользователя</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">{user.first_name || user.username || user.telegram_id}</h2>
          <p className="text-sm text-textMuted">ID: {user.id} · Telegram ID: {user.telegram_id}</p>
        </header>

        <div className="mt-6 space-y-6 overflow-y-auto pr-4">
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-white">Основная информация</h3>
            <div className="rounded-2xl border border-outline/40 bg-surfaceMuted/40 p-4 text-sm text-textMuted">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <InfoRow label="Username" value={user.username ? `@${user.username}` : "—"} />
                <InfoRow label="Имя" value={[user.first_name, user.last_name].filter(Boolean).join(" ") || "—"} />
                <InfoRow label="Язык" value={user.language} />
                <InfoRow label="Реф. код" value={user.referral_code || "—"} />
                <InfoRow label="Баланс" value={`${user.balance_rubles.toFixed(2)} ₽`} highlight={user.balance_rubles < 0} />
                <InfoRow label="Промо-группа" value={user.promo_group?.name || "—"} />
                <InfoRow label="Создан" value={formatDate(user.created_at)} />
                <InfoRow label="Активность" value={formatDate(user.last_activity)} />
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-white">Статус</h3>
            <div className="rounded-2xl border border-outline/40 bg-surfaceMuted/40 p-4 text-sm text-textMuted">
              <div className="flex flex-wrap items-center gap-3">
                <UserStatusBadge status={user.status} />
                <select
                  className="rounded-2xl border border-outline/40 bg-surface/60 px-3 py-2 text-sm text-textMuted focus:border-primary/70 focus:outline-none focus:ring-2 focus:ring-primary/40"
                  value={status}
                  onChange={(event) => setStatus(event.target.value)}
                >
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <button
                  className="button-primary"
                  onClick={handleStatusSave}
                  disabled={status === user.status || updateMutation.isPending}
                >
                  Сохранить
                </button>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-white">Корректировка баланса</h3>
            <div className="rounded-2xl border border-outline/40 bg-surfaceMuted/40 p-4 text-sm text-textMuted">
              <div className="grid gap-3 sm:grid-cols-2">
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

        {isUpdating ? (
          <div className="absolute inset-x-0 bottom-4 flex justify-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-outline/40 bg-surfaceMuted/80 px-4 py-2 text-xs text-textMuted">
              <Loader2 className="h-4 w-4 animate-spin" />
              Синхронизация…
            </span>
          </div>
        ) : null}
      </aside>
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
