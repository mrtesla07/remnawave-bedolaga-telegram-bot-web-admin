import { useCallback, useMemo } from "react";
import { FinanceFilters } from "@/components/finance/FinanceFilters";
import { FinanceSummary } from "@/components/finance/FinanceSummary";
import { FinanceTable } from "@/components/finance/FinanceTable";
import { useTransactionsList } from "@/features/finance/queries";

const PAGE_SIZE = 25;

export function FinancePage() {
  const { data, params, setParams, isLoading, isFetching } = useTransactionsList({ limit: PAGE_SIZE, offset: 0 });

  const items = data?.items ?? [];

  const canPrev = (params.offset ?? 0) > 0;
  const canNext = data ? (params.offset ?? 0) + (params.limit ?? PAGE_SIZE) < data.total : false;

  const meta = useMemo(() => {
    if (!data) return "";
    const start = (data.offset ?? 0) + 1;
    const end = Math.min((data.offset ?? 0) + (data.limit ?? PAGE_SIZE), data.total);
    return `${start}–${end} из ${data.total}`;
  }, [data]);

  const handleFiltersChange = useCallback(
    (filters: {
      user_id?: number;
      type?: string;
      payment_method?: string;
      is_completed?: boolean;
      date_from?: string;
      date_to?: string;
    }) => {
      setParams((prev) => ({
        ...prev,
        ...filters,
        offset: 0,
      }));
    },
    [setParams],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-white">Финансы</h1>
        <p className="text-sm text-textMuted">Мониторинг транзакций, платежей и статусов расчётов.</p>
      </div>

      <FinanceFilters onChange={handleFiltersChange} />

      <FinanceSummary items={items} />

      <FinanceTable items={items} isLoading={isLoading || isFetching} />

      <div className="flex items-center justify-between rounded-2xl border border-outline/40 bg-surfaceMuted/40 px-4 py-3 text-sm text-textMuted">
        <span>{meta}</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="button-ghost"
            disabled={!canPrev}
            onClick={() => {
              setParams((prev) => ({
                ...prev,
                offset: Math.max((prev.offset ?? 0) - (prev.limit ?? PAGE_SIZE), 0),
              }));
            }}
          >
            Назад
          </button>
          <button
            type="button"
            className="button-primary"
            disabled={!canNext}
            onClick={() => {
              setParams((prev) => ({
                ...prev,
                offset: (prev.offset ?? 0) + (prev.limit ?? PAGE_SIZE),
              }));
            }}
          >
            Далее
          </button>
        </div>
      </div>
    </div>
  );
}
