export type UserStatus =
  | "new"
  | "trial"
  | "active"
  | "paused"
  | "blocked"
  | "archived";

export interface PromoGroupSummary {
  id: number;
  name: string;
  server_discount_percent: number;
  traffic_discount_percent: number;
  device_discount_percent: number;
  apply_discounts_to_addons: boolean;
}

export interface SubscriptionSummary {
  id: number;
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
  connected_squads: string[];
}

export interface User {
  id: number;
  telegram_id: number;
  username?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  status: string;
  language: string;
  balance_kopeks: number;
  balance_rubles: number;
  referral_code?: string | null;
  referred_by_id?: number | null;
  has_had_paid_subscription: boolean;
  has_made_first_topup: boolean;
  created_at: string;
  updated_at: string;
  last_activity?: string | null;
  promo_group?: PromoGroupSummary | null;
  subscription?: SubscriptionSummary | null;
}

export interface UsersListResponse {
  items: User[];
  total: number;
  limit: number;
  offset: number;
}

export interface UsersListQuery {
  limit?: number;
  offset?: number;
  search?: string;
  status?: string;
  promo_group_id?: number;
}

export interface UserUpdatePayload {
  username?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  language?: string | null;
  status?: string | null;
  promo_group_id?: number | null;
  referral_code?: string | null;
  has_had_paid_subscription?: boolean | null;
  has_made_first_topup?: boolean | null;
}

export interface BalanceUpdatePayload {
  amount_rubles: number;
  description?: string;
  create_transaction?: boolean;
}
