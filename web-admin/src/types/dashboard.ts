export interface OverviewStats {
  users: {
    total: number;
    active: number;
    blocked: number;
    balanceRubles: number;
    balanceKopeks: number;
    deltaPercent?: number;
  };
  subscriptions: {
    active: number;
    expired: number;
    deltaPercent?: number;
  };
  payments: {
    todayRubles: number;
    todayKopeks: number;
  };
  support: {
    openTickets: number;
    resolutionPercent?: number;
  };
}

export interface RevenuePoint {
  date: string;
  value: number;
  projected?: boolean;
}

export interface QuickAction {
  label: string;
  description: string;
  action: "promo" | "broadcast" | "bot" | "sync";
}

export type ServerStatus = "online" | "degraded" | "offline";

export interface ServerMetric {
  label: string;
  value: string;
  hint?: string;
  trend?: number;
  badgeColor?: string;
}

export interface ServerCardData {
  id: string;
  name: string;
  location: string;
  provider: string;
  countryCode: string;
  status: ServerStatus;
  pingMs: number;
  downloadMbps: number;
  uploadMbps: number;
  downloadSpeedBps?: number;
  uploadSpeedBps?: number;
  downloadBytes?: number;
  uploadBytes?: number;
  trafficTb: number;
  trafficBytes?: number;
  realtimeTotalBytes?: number;
  temperatureC: number;
  uptimeHours: number;
  uptimePercent: number;
  cpuUsagePercent: number;
  ramUsagePercent: number;
  usersOnline: number;
  realtimeUpdatedAt?: string;
  metrics: ServerMetric[];
  history: RevenuePoint[];
}

export interface RemnawaveSystemInfo {
  cpuCores: number;
  cpuPhysicalCores: number;
  memoryTotalBytes: number;
  memoryUsedBytes: number;
  memoryFreeBytes: number;
  memoryAvailableBytes?: number;
  uptimeSeconds: number;
}

export interface RemnawaveSystemSummary {
  usersOnline: number;
  totalUsers: number;
  activeConnections: number;
  nodesOnline: number;
  usersLastDay: number;
  usersLastWeek: number;
  usersNeverOnline: number;
  totalUserTrafficBytes: number;
}

export interface RemnawaveUsersByStatus {
  [status: string]: number;
}

export interface RemnawaveBandwidth {
  realtimeDownloadBytes: number;
  realtimeUploadBytes: number;
  realtimeTotalBytes: number;
}

export interface RemnawaveTrafficPeriod {
  current: number;
  previous: number;
  difference?: string;
}

export interface RemnawaveTrafficPeriods {
  last2Days: RemnawaveTrafficPeriod;
  last7Days: RemnawaveTrafficPeriod;
  last30Days: RemnawaveTrafficPeriod;
  currentMonth: RemnawaveTrafficPeriod;
  currentYear: RemnawaveTrafficPeriod;
}

export interface RemnawaveSystemStats {
  server: RemnawaveSystemInfo;
  summary?: RemnawaveSystemSummary;
  usersByStatus?: RemnawaveUsersByStatus;
  bandwidth?: RemnawaveBandwidth;
  trafficPeriods?: RemnawaveTrafficPeriods;
  nodesRealtime?: Array<Record<string, unknown>>;
  nodesWeekly?: Array<Record<string, unknown>>;
  lastUpdated?: string;
}
