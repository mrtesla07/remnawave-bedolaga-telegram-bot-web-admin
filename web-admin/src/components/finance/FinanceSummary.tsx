import { format } from "date-fns";
import { ru } from "date-fns/locale";
import type { Transaction } from "@/types/transactions";

interface FinanceSummaryProps {
  items: Transaction[];
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB" }).format(value);
}

export function FinanceSummary({ items }: FinanceSummaryProps) {
  const income = items.filter((item) => item.amount_rubles > 0).reduce((sum, item) => sum + item.amount_rubles, 0);
  const expense = items.filter((item) => item.amount_rubles < 0).reduce((sum, item) => sum + item.amount_rubles, 0);
  const completed = items.filter((item) => item.is_completed).length;
  const pending = items.length - completed;

  const lastTransaction = items[0];

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <SummaryCard title="Пополнения" value={formatCurrency(income)} description="За выбранный период" tone="positive" />
      <SummaryCard title="Списания" value={formatCurrency(expense)} description="Со знаком минус" tone="negative" />
      <SummaryCard title="Завершено" value={`${completed}`} description={`${pending} в обработке`} />
      <SummaryCard
        title="Последняя операция"
        value={lastTransaction ? format(new Date(lastTransaction.created_at), "d MMM yyyy HH:mm", { locale: ru }) : "—"}
        description={lastTransaction ? lastTransaction.description ?? lastTransaction.type : "Нет данных"}
      />
    </div>
  );
}

interface SummaryCardProps {
  title: string;
  value: string;
  description?: string;
  tone?: "positive" | "negative" | "neutral";
}

function SummaryCard({ title, value, description, tone = "neutral" }: SummaryCardProps) {
  const toneClass =
    tone === "positive"
      ? "from-success/70 via-success/60 to-primary/40"
      : tone === "negative"
      ? "from-danger/70 via-danger/60 to-primary/40"
      : "from-primary/80 via-primary/60 to-sky/40";

  return (
    <article className="card glow-border relative overflow-hidden rounded-2xl border border-outline/40 bg-surface/70 p-6">
      <div className={`absolute inset-px rounded-[20px] bg-gradient-to-br ${toneClass} opacity-20`} />
      <div className="relative">
        <p className="text-xs uppercase tracking-[0.32em] text-textMuted/70">{title}</p>
        <p className="mt-3 text-2xl font-semibold text-white">{value}</p>
        {description ? <p className="mt-1 text-xs text-textMuted">{description}</p> : null}
      </div>
    </article>
  );
}
