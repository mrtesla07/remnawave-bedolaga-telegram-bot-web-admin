import { apiClient } from "@/lib/api-client";

export interface SubscriptionsQuery {
  limit?: number;
  offset?: number;
  user_id?: number;
  status?: string;
  is_trial?: boolean;
  date_from?: string;
  date_to?: string;
}

export interface SubscriptionListItem {
  id: number;
  user_id: number;
  username?: string | null;
  telegram_id?: number;
  status: string;
  actual_status: string;
  is_trial: boolean;
  start_date: string;
  end_date: string;
  traffic_limit_gb: number;
  traffic_used_gb: number;
  device_limit: number;
  autopay_enabled: boolean;
  autopay_days_before: number;
  subscription_url?: string | null;
  subscription_crypto_link?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface SubscriptionsListResponse {
  items: SubscriptionListItem[];
  total: number;
  limit: number;
  offset: number;
}

export async function fetchSubscriptions(params: SubscriptionsQuery = {}): Promise<SubscriptionsListResponse> {
  const { data } = await apiClient.get<any>("/subscriptions", {
    params: {
      limit: params.limit ?? 25,
      offset: params.offset ?? 0,
      user_id: params.user_id || undefined,
      status: params.status || undefined,
      is_trial: params.is_trial,
      date_from: params.date_from || undefined,
      date_to: params.date_to || undefined,
    },
  });
  if (Array.isArray(data)) {
    const items = (data as any[]).map((s) => ({
      id: s.id,
      user_id: s.user_id,
      username: s.username ?? undefined,
      telegram_id: s.telegram_id ?? undefined,
      status: s.status,
      actual_status: s.actual_status ?? s.status,
      is_trial: Boolean(s.is_trial),
      start_date: s.start_date,
      end_date: s.end_date,
      traffic_limit_gb: s.traffic_limit_gb ?? 0,
      traffic_used_gb: s.traffic_used_gb ?? 0,
      device_limit: s.device_limit ?? 1,
      autopay_enabled: Boolean(s.autopay_enabled),
      autopay_days_before: s.autopay_days_before ?? 3,
      subscription_url: s.subscription_url ?? null,
      subscription_crypto_link: s.subscription_crypto_link ?? null,
      created_at: s.created_at,
      updated_at: s.updated_at,
    })) as SubscriptionListItem[];
    return { items, total: items.length, limit: params.limit ?? 25, offset: params.offset ?? 0 };
  }
  return data as SubscriptionsListResponse;
}

export async function extendSubscription(id: number, days: number): Promise<void> {
  await apiClient.post(`/subscriptions/${id}/extend`, { days });
}

export async function addTrafficToSubscription(id: number, gigabytes: number): Promise<void> {
  await apiClient.post(`/subscriptions/${id}/traffic`, { gigabytes });
}

export async function addDevicesToSubscription(id: number, devices: number): Promise<void> {
  await apiClient.post(`/subscriptions/${id}/devices`, { devices });
}


