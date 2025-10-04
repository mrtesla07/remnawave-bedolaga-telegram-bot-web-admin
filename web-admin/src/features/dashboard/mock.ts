import type { OverviewStats, QuickAction, RevenuePoint, RemnawaveSystemStats, ServerCardData } from "@/types/dashboard";

export const mockSystemStats: RemnawaveSystemStats = {
  server: {
    cpuCores: 2,
    cpuPhysicalCores: 2,
    memoryTotalBytes: 3.8 * 1024 ** 3,
    memoryUsedBytes: 3.46 * 1024 ** 3,
    memoryFreeBytes: 0.34 * 1024 ** 3,
    memoryAvailableBytes: 2.7 * 1024 ** 3,
    uptimeSeconds: (21 * 24 + 1) * 3600,
  },
  lastUpdated: new Date().toISOString(),
};

export const mockOverviewStats: OverviewStats = {
  users: {
    total: 1284,
    active: 1120,
    blocked: 56,
    balanceRubles: 84290,
    balanceKopeks: 8429000,
    deltaPercent: 12.3,
  },
  subscriptions: {
    active: 968,
    expired: 42,
    deltaPercent: 8.5,
  },
  payments: {
    todayRubles: 12890,
    todayKopeks: 1289000,
  },
  support: {
    openTickets: 5,
    resolutionPercent: 68,
  },
};


export const mockRevenueTrend: RevenuePoint[] = [
  { date: "2024-09-01", value: 32000 },
  { date: "2024-09-05", value: 36050 },
  { date: "2024-09-09", value: 38840 },
  { date: "2024-09-13", value: 40210 },
  { date: "2024-09-17", value: 43860 },
  { date: "2024-09-21", value: 46240 },
  { date: "2024-09-25", value: 50180 },
  { date: "2024-09-29", value: 54290 },
  { date: "2024-10-03", value: 61240, projected: true },
  { date: "2024-10-07", value: 68490, projected: true },
];

export const mockQuickActions: QuickAction[] = [
  {
    label: "Создать промокод",
    description: "Гибкие условия и автоматические ограничения для акций.",
    action: "promo",
  },
  {
    label: "Массовая рассылка",
    description: "Отправляйте сообщения по сегментам пользователей.",
    action: "broadcast",
  },
  {
    label: "Создать бэкап",
    description: "Сделайте резервную копию данных бота и настроек.",
    action: "bot",
  },
  {
    label: "Синхронизация",
    description: "Актуализируйте данные RemnaWave и Telegram-бота.",
    action: "sync",
  },
];

function generateHistory(seed: number): RevenuePoint[] {
  const result: RevenuePoint[] = [];
  for (let i = 0; i < 24; i += 1) {
    const date = new Date();
    date.setHours(date.getHours() - (23 - i));
    const base = 20 + Math.sin((i + seed) / 3) * 8;
    const jitter = (seed * 7 + i * 3) % 5;
    result.push({
      date: date.toISOString(),
      value: Math.max(4, Math.round((base + jitter) * 10) / 10),
    });
  }
  return result;
}

export const mockServers: ServerCardData[] = [
  {
    id: "netherlands-1",
    name: "Netherlands-1",
    location: "Amsterdam, Digital Ocean",
    provider: "Digital Ocean",
    countryCode: "nl",
    status: "online",
    pingMs: 12,
    downloadMbps: 945,
    uploadMbps: 892,
    downloadSpeedBps: 118_125_000,
    uploadSpeedBps: 111_500_000,
    downloadBytes: 857_619_069_665,
    uploadBytes: 461_794_883_665,
    trafficTb: 1.2,
    trafficBytes: 1_319_413_953_330,
    realtimeTotalBytes: 1_319_413_953_330,
    temperatureC: 28,
    uptimeHours: 24 * 14 + 6,
    uptimePercent: 99.9,
    cpuUsagePercent: 45,
    ramUsagePercent: 68,
    usersOnline: 342,
    realtimeUpdatedAt: "2024-10-08T07:45:00Z",
    metrics: [
      { label: "Пользователи", value: "342", hint: "+12 за 24 ч" },
      { label: "CPU", value: "45%", badgeColor: "success" },
      { label: "RAM", value: "2.4 GB", hint: "из 8 GB" },
      { label: "Uptime", value: "99.9%" },
    ],
    history: generateHistory(2),
  },
  {
    id: "germany-2",
    name: "Germany-2",
    location: "Frankfurt, Hetzner",
    provider: "Hetzner",
    countryCode: "de",
    status: "degraded",
    pingMs: 34,
    downloadMbps: 812,
    uploadMbps: 711,
    downloadSpeedBps: 101_500_000,
    uploadSpeedBps: 88_875_000,
    downloadBytes: 593_736_278_999,
    uploadBytes: 395_824_185_999,
    trafficTb: 0.9,
    trafficBytes: 989_560_464_998,
    realtimeTotalBytes: 989_560_464_998,
    temperatureC: 31,
    uptimeHours: 24 * 7 + 4,
    uptimePercent: 99.1,
    cpuUsagePercent: 68,
    ramUsagePercent: 76,
    usersOnline: 298,
    realtimeUpdatedAt: "2024-10-08T07:40:00Z",
    metrics: [
      { label: "Пользователи", value: "298" },
      { label: "CPU", value: "68%", badgeColor: "warning" },
      { label: "RAM", value: "3.1 GB" },
      { label: "Uptime", value: "99.1%" },
    ],
    history: generateHistory(4),
  },
  {
    id: "sweden-1",
    name: "Sweden-1",
    location: "Stockholm, OVH",
    provider: "OVH",
    countryCode: "se",
    status: "online",
    pingMs: 41,
    downloadMbps: 698,
    uploadMbps: 642,
    downloadSpeedBps: 87_250_000,
    uploadSpeedBps: 80_250_000,
    downloadBytes: 483_785_116_221,
    uploadBytes: 395_824_185_999,
    trafficTb: 0.8,
    trafficBytes: 879_609_302_220,
    realtimeTotalBytes: 879_609_302_220,
    temperatureC: 26,
    uptimeHours: 24 * 12 + 8,
    uptimePercent: 100,
    cpuUsagePercent: 32,
    ramUsagePercent: 48,
    usersOnline: 256,
    realtimeUpdatedAt: "2024-10-08T07:35:00Z",
    metrics: [
      { label: "Пользователи", value: "256" },
      { label: "CPU", value: "32%", badgeColor: "success" },
      { label: "RAM", value: "1.8 GB" },
      { label: "Uptime", value: "100%" },
    ],
    history: generateHistory(6),
  },
];

