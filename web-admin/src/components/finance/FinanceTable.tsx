import { format } from "date-fns";
import { ru } from "date-fns/locale";
import clsx from "clsx";
import type { Transaction } from "@/types/transactions";
import { useUserDetails } from "@/features/users/queries";

interface FinanceTableProps {
  items: Transaction[];
  isLoading?: boolean;
}

function formatDate(value: string) {
  return format(new Date(value), "d MMM yyyy HH:mm", { locale: ru });
}

export function FinanceTable({ items, isLoading }: FinanceTableProps) {
  if (isLoading) {
    return (
      <div className="rounded-3xl border border-outline/40 bg-surface/60 p-8 text-center text-textMuted">
        Загрузка транзакций…
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="rounded-3xl border border-outline/40 bg-surface/60 p-8 text-center text-textMuted">
        Транзакции не найдены.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-outline/40">
      <table className="min-w-full divide-y divide-outline/40 bg-surface/80 text-sm">
        <thead className="bg-surfaceMuted/40 text-xs uppercase tracking-[0.28em] text-textMuted">
          <tr>
            <th className="px-4 py-3 text-left">ID</th>
            <th className="px-4 py-3 text-left">Пользователь</th>
            <th className="px-4 py-3 text-left">Тип</th>
            <th className="px-4 py-3 text-left">Сумма</th>
            <th className="px-4 py-3 text-left">Статус</th>
            <th className="px-4 py-3 text-left">Метод оплаты</th>
            <th className="px-4 py-3 text-left">Валюта</th>
            <th className="px-4 py-3 text-left">Создано</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-outline/40">
          {items.map((tx) => (
            <TransactionRow key={tx.id} transaction={tx} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function mapType(type: string, tx?: Transaction) {
  switch (type) {
    case "deposit":
      return isAdminTopup(tx) ? "Пополнение (админ)" : "Пополнение";
    case "withdrawal":
      return "Списание";
    case "subscription_payment":
      return "Оплата подписки";
    case "refund":
      return "Возврат";
    case "referral_reward":
      return "Реферальное вознаграждение";
    default:
      return type;
  }
}

function isAdminTopup(tx?: Transaction): boolean {
  if (!tx) return false;
  const method = (tx.payment_method || "").toLowerCase();
  if (!method) return true;
  return ["admin", "manual", "panel", "web-admin", "operator"].includes(method);
}

function renderPaymentMethod(tx: Transaction): string {
  const method = (tx.payment_method || "").toLowerCase();
  if (!method) return "Администратор";
  if (["admin", "manual", "panel", "web-admin", "operator"].includes(method)) return "Администратор";
  if (method === "yookassa") return "ЮKassa";
  if (method === "cryptobot" || method === "crypto_bot") return "CryptoBot";
  if (method === "telegram_stars" || method === "stars") return "Telegram Stars";
  if (method === "pal24") return "Pal24";
  if (method === "mulenpay") return "MulenPay";
  return tx.payment_method || "—";
}

function renderStatus(tx: Transaction): string {
  if (tx.status) {
    switch (tx.status) {
      case "pending":
        return "В ожидании";
      case "failed":
      case "canceled":
      case "cancelled":
        return "Отменено";
      case "processing":
        return "Обработка";
      case "completed":
      case "succeeded":
      case "success":
        return "Завершено";
      default:
        return tx.status;
    }
  }
  return tx.is_completed ? "Завершено" : "В ожидании";
}

function TransactionRow({ transaction }: { transaction: Transaction }) {
  const userCell = useUserDetails(transaction.user_id ?? null);
  return (
    <tr className="bg-surface/60">
      <td className="px-4 py-3 font-medium text-slate-100">{transaction.id}</td>
      <td className="px-4 py-3 text-textMuted">
        {userCell.isLoading ? (
          <span className="inline-flex items-center gap-2 text-xs text-textMuted">
            <span className="h-2 w-2 animate-pulse rounded-full bg-primary/60" /> ID: {transaction.user_id}
          </span>
        ) : userCell.isError || !userCell.data ? (
          <span className="text-textMuted">ID: {transaction.user_id}</span>
        ) : (
          <span className="text-slate-100">
            {userCell.data.username ? `@${userCell.data.username}` : "—"}
            <span className="text-textMuted"> (tg: {userCell.data.telegram_id})</span>
          </span>
        )}
      </td>
      <td className="px-4 py-3 text-textMuted">{mapType(transaction.type, transaction)}</td>
      <td className="px-4 py-3 text-textMuted">
        <span className={clsx("font-semibold", transaction.amount_rubles < 0 ? "text-danger" : "text-success")}>
          {transaction.amount_rubles.toFixed(2)} ₽
        </span>
      </td>
      <td className="px-4 py-3 text-textMuted">{renderStatus(transaction)}</td>
      <td className="px-4 py-3 text-textMuted">{renderPaymentMethod(transaction)}</td>
      <td className="px-4 py-3 text-textMuted">{transaction.currency || "RUB"}</td>
      <td className="px-4 py-3 text-textMuted">{formatDate(transaction.created_at)}</td>
    </tr>
  );
}

function UserCell({ userId }: { userId: number }) {
  const query = useUserDetails(userId);
  if (query.isLoading) {
    return <span className="inline-flex items-center gap-2 text-xs text-textMuted"><span className="h-2 w-2 animate-pulse rounded-full bg-primary/60" /> ID: {userId}</span>;
  }
  if (query.isError || !query.data) {
    return <span className="text-textMuted">ID: {userId}</span>;
  }
  const user = query.data;
  const username = user.username ? `@${user.username}` : "—";
  return <span className="text-slate-100">{username} <span className="text-textMuted">(tg: {user.telegram_id})</span></span>;
}
