import { createBrowserRouter, Navigate, RouterProvider } from "react-router-dom";
import { MainLayout } from "@/layouts/MainLayout";
import { DashboardPage } from "@/pages/dashboard/DashboardPage";
import { FinancePage } from "@/pages/finance/FinancePage";
import { StatisticsPage } from "@/pages/statistics/StatisticsPage";
import { HealthPage } from "@/pages/health/HealthPage";
import { SettingsPage } from "@/pages/settings/SettingsPage";
import { TokensPage } from "@/pages/tokens/TokensPage";
import { UsersPage } from "@/pages/users/UsersPage";
import { PlaceholderPage } from "@/pages/PlaceholderPage";
import { AuthPage } from "@/pages/auth/AuthPage";
import { TicketsPage } from "@/pages/tickets/TicketsPage";
import { SubscriptionsPage } from "@/pages/subscriptions/SubscriptionsPage";
import { PromocodesPage } from "@/pages/promocodes/PromocodesPage";

const placeholderRoutes = [
  { path: "statistics", title: "Статистика", description: "Метрики продукта и воронок продаж." },
  { path: "subscriptions", title: "Подписки", description: "Детали активных подписок и продление." },
  { path: "promocodes", title: "Промокоды", description: "Создание акций и скидок." },
  { path: "tickets", title: "Тикеты", description: "Работа с обращениями и SLA." },
  { path: "campaigns", title: "Рассылки", description: "Планирование маркетинговых кампаний." },
  { path: "remnawave/nodes", title: "RemnaWave · Серверы", description: "Глубокий мониторинг инфраструктуры." },
  { path: "remnawave/sync", title: "Синхронизация", description: "Синхронизация данных бота и RemnaWave." },
  { path: "logs", title: "Логи", description: "История действий и событий." },
  { path: "tokens", title: "API ключи", description: "Управление токенами Web API." },
  { path: "settings", title: "Настройки", description: "Конфигурация платформы и тарифов." },
  { path: "backups", title: "Резервные копии", description: "Управление бэкапами и восстановлением." },
  { path: "security", title: "Безопасность", description: "Политики безопасности и контроль сессий." },
  { path: "notifications", title: "Уведомления", description: "Центр управления уведомлениями." },
];

const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    children: [
      { path: "auth", element: <AuthPage /> },
      {
        index: true,
        element: <DashboardPage />,
      },
      {
        path: "finance",
        element: <FinancePage />,
      },
      {
        path: "statistics",
        element: <StatisticsPage />,
      },
      {
        path: "users",
        element: <UsersPage />,
      },
      {
        path: "subscriptions",
        element: <SubscriptionsPage />,
      },
      {
        path: "tickets",
        element: <TicketsPage />,
      },
      {
        path: "promocodes",
        element: <PromocodesPage />,
      },
      {
        path: "health",
        element: <HealthPage />,
      },
      {
        path: "settings",
        element: <SettingsPage />,
      },
      {
        path: "tokens",
        element: <TokensPage />,
      },
      ...placeholderRoutes
        .filter((route) => route.path !== "subscriptions" && route.path !== "promocodes" && route.path !== "tickets")
        .map((route) => ({
          path: route.path,
          element: <PlaceholderPage title={route.title} description={route.description} />,
        })),
      {
        path: "*",
        element: <Navigate to="/" replace />,
      },
    ],
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
