import { format } from "date-fns";
import { ru } from "date-fns/locale";
import clsx from "clsx";
import type { User } from "@/types/users";
import { UserStatusBadge } from "@/components/users/UserStatusBadge";

interface UsersTableProps {
  items: User[];
  onSelect: (user: User) => void;
  isLoading?: boolean;
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  return format(new Date(value), "d MMM yyyy HH:mm", { locale: ru });
}

export function UsersTable({ items, onSelect, isLoading }: UsersTableProps) {
  if (isLoading) {
    return (
      <div className="rounded-3xl border border-outline/40 bg-surface/60 p-8 text-center text-textMuted">
        Загрузка пользователей…
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="rounded-3xl border border-outline/40 bg-surface/60 p-8 text-center text-textMuted">
        Пользователи не найдены.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-outline/40">
      <table className="min-w-full divide-y divide-outline/40 bg-surface/80 text-sm">
        <thead className="bg-surfaceMuted/40 text-xs uppercase tracking-[0.28em] text-textMuted">
          <tr>
            <th className="px-4 py-3 text-left">ID</th>
            <th className="px-4 py-3 text-left">Telegram</th>
            <th className="px-4 py-3 text-left">Имя</th>
            <th className="px-4 py-3 text-left">Статус</th>
            <th className="px-4 py-3 text-left">Баланс</th>
            <th className="px-4 py-3 text-left">Промо-группа</th>
            <th className="px-4 py-3 text-left">Создан</th>
            <th className="px-4 py-3 text-left">Активность</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-outline/40">
          {items.map((user) => (
            <tr
              key={user.id}
              className="cursor-pointer bg-surface/60 transition hover:bg-surfaceMuted/60"
              onClick={() => onSelect(user)}
            >
              <td className="px-4 py-3 font-medium text-slate-100">{user.id}</td>
              <td className="px-4 py-3 text-textMuted">
                <div className="flex flex-col">
                  <span className="font-medium text-slate-100">{user.telegram_id}</span>
                  {user.username ? <span className="text-xs text-textMuted">@{user.username}</span> : null}
                </div>
              </td>
              <td className="px-4 py-3 text-textMuted">
                {[user.first_name, user.last_name].filter(Boolean).join(" ") || "—"}
              </td>
              <td className="px-4 py-3 text-textMuted">
                <UserStatusBadge status={user.status} />
              </td>
              <td className="px-4 py-3 text-textMuted">
                <span className={clsx("font-semibold", user.balance_rubles < 0 && "text-danger")}>{user.balance_rubles.toFixed(2)} ₽</span>
              </td>
              <td className="px-4 py-3 text-textMuted">{user.promo_group?.name ?? "—"}</td>
              <td className="px-4 py-3 text-textMuted">{formatDate(user.created_at)}</td>
              <td className="px-4 py-3 text-textMuted">{formatDate(user.last_activity)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
