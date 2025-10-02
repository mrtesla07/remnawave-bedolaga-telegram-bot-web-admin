import { useMemo } from "react";
import { Server, Users, Layers, CreditCard, LifeBuoy, Activity } from "lucide-react";
import { Link } from "react-router-dom";
import { useOverviewStats, useRevenueTrend, useRemnawaveSystem, useServers } from "@/features/dashboard/queries";
import type { OverviewStats } from "@/types/dashboard";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { SalesChartCard } from "@/components/dashboard/SalesChartCard";
import { AnimatedNumber } from "@/components/shared/AnimatedNumber";

export function StatisticsPage() {
  const overviewQuery = useOverviewStats();
  const data: OverviewStats | null = overviewQuery.data ?? null;
  const revenueQuery = useRevenueTrend();
  const revenuePoints = revenueQuery.data ?? [];
  const remnaSystem = useRemnawaveSystem().data ?? null;
  const serversQuery = useServers();
  const servers = serversQuery.data ?? [];
  const nodesAvailable = useMemo(() => servers.filter((s) => s.status === "online").length, [servers]);

  const numberFormatter = useMemo(() => new Intl.NumberFormat("ru-RU"), []);
  const currencyFormatter = useMemo(() => new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB", minimumFractionDigits: 0, maximumFractionDigits: 2 }), []);

  const usersTotal = data ? <AnimatedNumber value={data.users.total} /> : "—";
  const usersActive = data ? numberFormatter.format(data.users.active) : "—";
  const usersBlocked = data ? numberFormatter.format(data.users.blocked) : "—";
  const paymentsToday = data ? <AnimatedNumber value={Math.round(data.payments.todayRubles * 100) / 100} format={(n) => currencyFormatter.format(n)} /> : "—";
  const subsActive = data ? <AnimatedNumber value={data.subscriptions.active} /> : "—";
  const subsExpired = data ? numberFormatter.format(data.subscriptions.expired) : "—";
  const openTickets = data ? <AnimatedNumber value={data.support.openTickets} /> : "—";
  const balanceRubles = data ? <AnimatedNumber value={Math.round(data.users.balanceRubles * 100) / 100} format={(n) => currencyFormatter.format(n)} /> : "—";

  return (
    <section className="space-y-8">
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surfaceMuted/80 text-primary">
            <Server className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.32em] text-textMuted/70">Аналитика</p>
            <h1 className="text-xl font-semibold text-white">Статистика</h1>
          </div>
        </div>
        <Link to="/api-reference" className="inline-flex items-center gap-2 rounded-xl bg-primary/20 px-3 py-2 text-sm font-semibold text-primary hover:bg-primary/30">
          API справка
        </Link>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Всего пользователей"
          value={usersTotal}
          caption={`Активных: ${usersActive} · Заблокировано: ${usersBlocked}`}
          icon={Users}
          accent="purple"
        />
        <MetricCard
          title="Подписки"
          value={subsActive}
          caption={`Активные · Просрочено: ${subsExpired}`}
          icon={Layers}
          accent="green"
        />
        <MetricCard
          title="Платежи сегодня"
          value={paymentsToday}
          icon={CreditCard}
          accent="blue"
        />
        <MetricCard
          title="Открытых тикетов"
          value={openTickets}
          icon={LifeBuoy}
          accent="pink"
        />
        <MetricCard
          title="Баланс клиентов"
          value={balanceRubles}
          caption="Сумма на балансах пользователей"
          icon={Activity}
          accent="blue"
        />
      </div>

      <SalesChartCard
        title="Выручка по дням"
        subtitle="Сумма пополнений за последние 30 дней"
        points={revenuePoints}
        variant="standalone"
      />

      {/* Быстрые метрики по выручке */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard
          title="За 7 дней"
          value={<AnimatedNumber value={sumLastNDays(revenuePoints, 7)} format={(n) => currencyFormatter.format(n)} />}
          caption="Сумма пополнений за последние 7 дней"
          icon={CreditCard}
          accent="blue"
        />
        <MetricCard
          title="Среднедневная (30 дн)"
          value={<AnimatedNumber value={avgLastNDays(revenuePoints, 30)} format={(n) => currencyFormatter.format(n)} />}
          caption="Средняя дневная выручка"
          icon={Layers}
          accent="green"
        />
        <MetricCard
          title="Лучший день (30 дн)"
          value={<AnimatedNumber value={bestDayValue(revenuePoints, 30)} format={(n) => currencyFormatter.format(n)} />}
          caption={bestDayLabel(revenuePoints, 30)}
          icon={Activity}
          accent="purple"
        />
      </div>

      {remnaSystem ? (
        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-white/80">RemnaWave · сводка</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <MetricCard
              title="Онлайн пользователей"
              value={<AnimatedNumber value={remnaSystem.summary?.usersOnline ?? 0} />}
              caption={`Всего: ${numberFormatter.format(remnaSystem.summary?.totalUsers ?? 0)}`}
              icon={Users}
              accent="purple"
            />
            <MetricCard
              title="Активные подключения"
              value={<AnimatedNumber value={remnaSystem.summary?.activeConnections ?? 0} />}
              caption="RemnaWave"
              icon={Activity}
              accent="pink"
            />
            <MetricCard
              title="Нод доступно"
              value={<AnimatedNumber value={nodesAvailable || remnaSystem.summary?.nodesOnline || 0} />}
              caption="на основе статуса server.status === online"
              icon={Server}
              accent="green"
            />
            <MetricCard
              title="Трафик (реалтайм)"
              value={<AnimatedNumber value={remnaSystem.bandwidth?.realtimeTotalBytes ? Math.round((remnaSystem.bandwidth.realtimeTotalBytes / (1024 ** 3)) * 100) / 100 : 0} format={(n)=>`${numberFormatter.format(n)} ГБ`} />}
              caption={`↓ ${formatBytes(remnaSystem.bandwidth?.realtimeDownloadBytes)} · ↑ ${formatBytes(remnaSystem.bandwidth?.realtimeUploadBytes)}`}
              icon={Activity}
              accent="blue"
            />
          </div>
        </section>
      ) : null}
    </section>
  );
}

function formatBytes(bytes?: number | null): string {
  if (!bytes || bytes <= 0) return "0 Б";
  const units = ["Б", "КБ", "МБ", "ГБ", "ТБ"]; let i = 0; let value = bytes;
  while (value >= 1024 && i < units.length - 1) { value /= 1024; i += 1; }
  const num = value >= 10 ? Math.round(value) : Math.round(value * 10) / 10;
  return `${num} ${units[i]}`;
}

function sumLastNDays(points: Array<{ date: string; value: number }>, days: number): number {
  const slice = points.slice(-days);
  return slice.reduce((acc, p) => acc + (p.value || 0), 0);
}

function avgLastNDays(points: Array<{ date: string; value: number }>, days: number): number {
  const total = sumLastNDays(points, days);
  return days > 0 ? Math.round((total / days) * 100) / 100 : 0;
}

function bestDayValue(points: Array<{ date: string; value: number }>, days: number): number {
  const slice = points.slice(-days);
  return slice.reduce((max, p) => (p.value > max ? p.value : max), 0);
}

function bestDayLabel(points: Array<{ date: string; value: number }>, days: number): string {
  const slice = points.slice(-days);
  let best = { date: "", value: -1 };
  for (const p of slice) {
    if (p.value > best.value) best = p as { date: string; value: number };
  }
  if (!best.date) return "—";
  const d = new Date(best.date);
  return d.toLocaleDateString("ru-RU");
}

