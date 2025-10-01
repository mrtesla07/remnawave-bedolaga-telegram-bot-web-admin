import { useMemo } from "react";
import { CreditCard, Layers, LifeBuoy, Users } from "lucide-react";
import { OverviewPanel } from "@/components/dashboard/OverviewPanel";
import { SystemStatsCard } from "@/components/dashboard/SystemStatsCard";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { ServerCard } from "@/components/dashboard/ServerCard";
import { Alert } from "@/components/shared/Alert";
import { useOverviewStats, useRemnawaveSystem, useRevenueTrend, useServers } from "@/features/dashboard/queries";
import { mockOverviewStats, mockQuickActions, mockRevenueTrend, mockServers } from "@/features/dashboard/mock";

const numberFormatter = new Intl.NumberFormat("ru-RU");

const currencyFormatter = new Intl.NumberFormat("ru-RU", {
  style: "currency",
  currency: "RUB",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export function DashboardPage() {
  const overviewQuery = useOverviewStats();
  const systemQuery = useRemnawaveSystem();
  const revenueQuery = useRevenueTrend();
  const serversQuery = useServers();

  const systemStats = systemQuery.data ?? null;
  const overview = overviewQuery.data ?? mockOverviewStats;
  const revenuePoints = revenueQuery.isError ? mockRevenueTrend : revenueQuery.data ?? [];
  const servers = serversQuery.isError ? mockServers : serversQuery.data ?? [];

  const overviewMetrics = useMemo(() => {
    const { users, subscriptions, payments, support } = overview;

    const subscriptionsTotal = subscriptions.active + subscriptions.expired;
    const subscriptionsCaption = subscriptionsTotal > 0
      ? `${subscriptions.active} активных · ${subscriptions.expired} просроч.`
      : "Нет данных по подпискам";

    const supportCaption =
      support.openTickets === 0
        ? "Очередь пуста"
        : `${support.openTickets} тикетов в работе}`;

    const paymentsRubles = Math.round(payments.todayRubles * 100) / 100;
    const balanceRubles = Math.round(users.balanceRubles * 100) / 100;

    return [
      {
        id: "users",
        title: "Всего пользователей",
        value: numberFormatter.format(users.total),
        caption: `${users.active} активных · ${users.blocked} блок.`,
        delta: users.deltaPercent,
        deltaLabel: users.deltaPercent !== undefined ? "за 30 дней" : undefined,
        icon: Users,
        accent: "purple" as const,
      },
      {
        id: "subscriptions",
        title: "Подписки",
        value: numberFormatter.format(subscriptions.active),
        caption: subscriptionsCaption,
        delta: subscriptions.deltaPercent,
        deltaLabel: subscriptions.deltaPercent !== undefined ? "за 30 дней" : undefined,
        icon: Layers,
        accent: "green" as const,
      },
      {
        id: "payments",
        title: "Платежи сегодня",
        value: currencyFormatter.format(paymentsRubles),
        caption: `Баланс клиентов: ${currencyFormatter.format(balanceRubles)}`,
        icon: CreditCard,
        accent: "blue" as const,
      },
      {
        id: "support",
        title: "Поддержка",
        value: numberFormatter.format(support.openTickets),
        caption: supportCaption,
        icon: LifeBuoy,
        accent: "pink" as const,
      },
    ];
  }, [overview]);
const primaryServer = servers[0] ?? null;
  const otherServers = primaryServer ? servers.slice(1) : servers;

  const errors: Array<{ id: string; message: string; tone: "info" | "warning" }> = [];
  if (overviewQuery.isError) {
    errors.push({
      id: "overview",
      tone: "info",
      message: "Не удалось получить сводную статистику. Показаны примерные данные.",
    });
  }
  if (revenueQuery.isError) {
    errors.push({
      id: "revenue",
      tone: "info",
      message: "Не удалось загрузить график продаж. Используется демо-статистика.",
    });
  }
  if (serversQuery.isError) {
    errors.push({
      id: "servers",
      tone: "warning",
      message: "RemnaWave недоступен или не настроен. Серверы отображаются условно.",
    });
  }

  return (
    <div className="space-y-8">
      {errors.length > 0 ? (
        <div className="space-y-3">
          {errors.map((error) => (
            <Alert key={error.id} tone={error.tone} title={error.message} />
          ))}
        </div>
      ) : null}

      <OverviewPanel metrics={overviewMetrics} chartPoints={revenuePoints} />

      <SystemStatsCard
        stats={systemStats}
        isLoading={systemQuery.isLoading && !systemQuery.data}
      />

      <QuickActions actions={mockQuickActions} />

      <section className="space-y-4">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white">Активные серверы</h2>
            <p className="text-sm text-textMuted">Мониторинг RemnaWave в реальном времени</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-textMuted">
            <span className="rounded-full border border-outline/40 px-3 py-1 uppercase tracking-widest">online</span>
            <span className="rounded-full border border-outline/40 px-3 py-1 uppercase tracking-widest">degraded</span>
            <span className="rounded-full border border-outline/40 px-3 py-1 uppercase tracking-widest">offline</span>
          </div>
        </header>
        {servers.length === 0 ? (
          <div className="rounded-3xl border border-outline/40 bg-surface/60 p-8 text-center text-textMuted">
            Нет данных по серверам.
          </div>
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {primaryServer ? <ServerCard server={primaryServer} layout="wide" /> : null}
            {otherServers.map((server) => (
              <ServerCard key={server.id} server={server} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
