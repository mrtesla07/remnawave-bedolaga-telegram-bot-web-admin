import { useEffect, useState } from "react";

interface FinanceFiltersProps {
  onChange: (filters: {
    user_id?: number;
    type?: string;
    payment_method?: string;
    status?: string;
    is_completed?: boolean;
    date_from?: string;
    date_to?: string;
    amount_min?: number;
    amount_max?: number;
    currency?: string;
  }) => void;
}

const TYPE_OPTIONS = [
  { value: "", label: "Все операции" },
  { value: "deposit", label: "Пополнения" },
  { value: "withdrawal", label: "Списания" },
  { value: "subscription_payment", label: "Оплаты подписки" },
  { value: "refund", label: "Возвраты" },
  { value: "referral_reward", label: "Реферальные" },
];

const STATUS_OPTIONS = [
  { value: "", label: "Все статусы" },
  { value: "completed", label: "Завершено" },
  { value: "pending", label: "В ожидании" },
  { value: "failed", label: "Ошибка" },
  { value: "processing", label: "Обработка" },
  { value: "canceled", label: "Отменено" },
];

const CURRENCY_OPTIONS = [
  { value: "", label: "Все валюты" },
  { value: "RUB", label: "RUB" },
  { value: "USD", label: "USD" },
  { value: "EUR", label: "EUR" },
  { value: "USDT", label: "USDT" },
];

export function FinanceFilters({ onChange }: FinanceFiltersProps) {
  const [userId, setUserId] = useState("");
  const [type, setType] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [status, setStatus] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [amountMin, setAmountMin] = useState("");
  const [amountMax, setAmountMax] = useState("");
  const [currency, setCurrency] = useState("");

  useEffect(() => {
    onChange({
      user_id: userId ? Number(userId) : undefined,
      type: type || undefined,
      payment_method: paymentMethod || undefined,
      status: status || undefined,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
      amount_min: amountMin ? Number(amountMin) : undefined,
      amount_max: amountMax ? Number(amountMax) : undefined,
      currency: currency || undefined,
    });
  }, [userId, type, paymentMethod, status, dateFrom, dateTo, amountMin, amountMax, currency, onChange]);

  return (
    <div className="grid gap-3 rounded-3xl border border-outline/40 bg-surfaceMuted/40 p-4 md:grid-cols-3 xl:grid-cols-6">
      <input
        className="rounded-2xl border border-outline/40 bg-surface/60 px-3 py-2 text-sm text-slate-100 placeholder:text-textMuted focus:border-primary/70 focus:outline-none focus:ring-2 focus:ring-primary/30"
        placeholder="ID пользователя"
        value={userId}
        onChange={(event) => setUserId(event.target.value.replace(/[^0-9]/g, ""))}
      />
      <select
        className="rounded-2xl border border-outline/40 bg-surface/70 px-3 py-2 text-sm text-white focus:border-primary/70 focus:outline-none focus:ring-2 focus:ring-primary/30"
        value={type}
        onChange={(event) => setType(event.target.value)}
      >
        {TYPE_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <input
        className="rounded-2xl border border-outline/40 bg-surface/60 px-3 py-2 text-sm text-slate-100 placeholder:text-textMuted focus:border-primary/70 focus:outline-none focus:ring-2 focus:ring-primary/30"
        placeholder="Платёжная система"
        value={paymentMethod}
        onChange={(event) => setPaymentMethod(event.target.value)}
      />
      <select
        className="rounded-2xl border border-outline/40 bg-surface/70 px-3 py-2 text-sm text-white focus:border-primary/70 focus:outline-none focus:ring-2 focus:ring-primary/30"
        value={status}
        onChange={(event) => setStatus(event.target.value)}
      >
        {STATUS_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <input
        type="date"
        className="rounded-2xl border border-outline/40 bg-surface/60 px-3 py-2 text-sm text-textMuted focus:border-primary/70 focus:outline-none focus:ring-2 focus:ring-primary/30"
        value={dateFrom}
        onChange={(event) => setDateFrom(event.target.value)}
      />
      <input
        type="date"
        className="rounded-2xl border border-outline/40 bg-surface/60 px-3 py-2 text-sm text-textMuted focus:border-primary/70 focus:outline-none focus:ring-2 focus:ring-primary/30"
        value={dateTo}
        onChange={(event) => setDateTo(event.target.value)}
      />
      <div className="flex items-center gap-2 rounded-2xl border border-outline/40 bg-surface/60 px-3 py-2">
        <span className="text-xs uppercase tracking-[0.28em] text-textMuted/70">Сумма ₽</span>
        <input
          type="number"
          className="w-full bg-transparent text-sm text-slate-100 placeholder:text-textMuted focus:outline-none"
          placeholder="от"
          value={amountMin}
          min="0"
          onChange={(event) => setAmountMin(event.target.value.replace(/[^0-9.]/g, ""))}
        />
        <span className="text-textMuted">—</span>
        <input
          type="number"
          className="w-full bg-transparent text-sm text-slate-100 placeholder:text-textMuted focus:outline-none"
          placeholder="до"
          value={amountMax}
          min="0"
          onChange={(event) => setAmountMax(event.target.value.replace(/[^0-9.]/g, ""))}
        />
      </div>
      <select
        className="rounded-2xl border border-outline/40 bg-surface/70 px-3 py-2 text-sm text-white focus:border-primary/70 focus:outline-none focus:ring-2 focus:ring-primary/30"
        value={currency}
        onChange={(event) => setCurrency(event.target.value)}
      >
        {CURRENCY_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
