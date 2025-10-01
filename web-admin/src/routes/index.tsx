import { createBrowserRouter, Navigate, RouterProvider } from "react-router-dom";
import { MainLayout } from "@/layouts/MainLayout";
import { DashboardPage } from "@/pages/dashboard/DashboardPage";
import { FinancePage } from "@/pages/finance/FinancePage";
import { UsersPage } from "@/pages/users/UsersPage";
import { PlaceholderPage } from "@/pages/PlaceholderPage";

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
      {
        index: true,
        element: <DashboardPage />,
      },
      {
        path: "finance",
        element: <FinancePage />,
      },
      {
        path: "users",
        element: <UsersPage />,
      },
      ...placeholderRoutes.map((route) => ({
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
