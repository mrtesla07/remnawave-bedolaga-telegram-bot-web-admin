import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Wallet,
  BarChart3,
  Users,
  CreditCard,
  Gift,
  Ticket,
  Server,
  Megaphone,
  KeyRound,
  Settings,
  Database,
  Shield,
  ScrollText,
  BellRing,
  Radio,
} from "lucide-react";

export type NavItem = {
  label: string;
  to: string;
  icon: LucideIcon;
  badge?: string;
  isSoon?: boolean;
};

export type NavSection = {
  title: string;
  items: NavItem[];
};

export const NAV_SECTIONS: NavSection[] = [
  {
    title: "Аналитика",
    items: [
      { label: "Дашборд", to: "/", icon: LayoutDashboard },
      { label: "Финансы", to: "/finance", icon: Wallet },
      { label: "Статистика", to: "/statistics", icon: BarChart3 },
    ],
  },
  {
    title: "Клиенты",
    items: [
      { label: "Пользователи", to: "/users", icon: Users },
      { label: "Подписки", to: "/subscriptions", icon: CreditCard },
      { label: "Промокоды", to: "/promocodes", icon: Gift },
      { label: "Тикеты", to: "/tickets", icon: Ticket },
      { label: "Рассылки", to: "/campaigns", icon: Megaphone, badge: "beta" },
    ],
  },
  {
    title: "Система",
    items: [
      { label: "RemnaWave", to: "/remnawave/nodes", icon: Server },
      { label: "Синхронизация", to: "/remnawave/sync", icon: Radio },
      { label: "Логи", to: "/logs", icon: ScrollText, isSoon: true },
      { label: "API ключи", to: "/tokens", icon: KeyRound },
      { label: "Настройки", to: "/settings", icon: Settings },
      { label: "Резервные копии", to: "/backups", icon: Database },
      { label: "Безопасность", to: "/security", icon: Shield, isSoon: true },
      { label: "Уведомления", to: "/notifications", icon: BellRing, isSoon: true },
    ],
  },
];
