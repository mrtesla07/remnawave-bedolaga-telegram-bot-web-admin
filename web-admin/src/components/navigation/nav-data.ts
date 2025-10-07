﻿import type { LucideIcon } from "lucide-react";
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
  Zap,
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
    title: "Обзор",
    items: [
      { label: "Главная", to: "/", icon: LayoutDashboard },
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
      { label: "Промо-предложения", to: "/promo-offers", icon: Radio, badge: "new" },
      { label: "Тестовые доступы", to: "/promo-offers/test-access", icon: Zap, badge: "new" },
      { label: "Заявки", to: "/tickets", icon: Ticket },
      { label: "Кампании", to: "/campaigns", icon: Megaphone, badge: "beta" },
    ],
  },
  {
    title: "Система",
    items: [
      { label: "RemnaWave", to: "/remnawave", icon: Server },
      { label: "Логи", to: "/logs", icon: ScrollText },
      { label: "API токены", to: "/tokens", icon: KeyRound },
      { label: "Настройки", to: "/settings", icon: Settings },
      { label: "Резервные копии", to: "/backups", icon: Database },
      { label: "Безопасность", to: "/security", icon: Shield },
      { label: "Уведомления", to: "/notifications", icon: BellRing },
    ],
  },
];

