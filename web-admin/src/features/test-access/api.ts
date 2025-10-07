import { apiClient } from "@/lib/api-client";
import type { PromoOfferUserInfo } from "@/features/promo-offers/api";

export interface TestAccessSubscriptionInfo {
  id: number;
  status?: string | null;
  is_trial?: boolean | null;
  autopay_enabled?: boolean | null;
  start_date?: string | null;
  end_date?: string | null;
  connected_squads: string[];
}

export interface TestAccessOfferInfo {
  id: number;
  notification_type?: string | null;
  discount_percent?: number | null;
  bonus_amount_kopeks?: number | null;
  effect_type?: string | null;
  expires_at?: string | null;
}

export interface TestAccessSquadInfo {
  uuid: string;
  display_name?: string | null;
  country_code?: string | null;
  is_available?: boolean | null;
  price_kopeks?: number | null;
  description?: string | null;
}

export interface TestAccessEntry {
  id: number;
  offer_id: number;
  user?: PromoOfferUserInfo | null;
  subscription?: TestAccessSubscriptionInfo | null;
  squad_uuid: string;
  squad?: TestAccessSquadInfo | null;
  expires_at: string;
  created_at: string;
  deactivated_at?: string | null;
  is_active: boolean;
  was_already_connected: boolean;
  offer?: TestAccessOfferInfo | null;
}

export interface TestAccessListResponse {
  items: TestAccessEntry[];
  total: number;
  limit: number;
  offset: number;
}

export interface TestAccessQuery {
  limit?: number;
  offset?: number;
  is_active?: boolean | null;
  user_id?: number;
  offer_id?: number;
  squad_uuid?: string;
}

export async function fetchTestAccessList(params: TestAccessQuery = {}): Promise<TestAccessListResponse> {
  const { data } = await apiClient.get<TestAccessListResponse>("/promo-offers/test-access", {
    params: {
      limit: params.limit ?? 25,
      offset: params.offset ?? 0,
      is_active: params.is_active,
      user_id: params.user_id,
      offer_id: params.offer_id,
      squad_uuid: params.squad_uuid,
    },
  });
  return data;
}

export interface TestAccessExtendPayload {
  extend_hours?: number;
  expires_at?: string;
}

export async function extendTestAccess(accessId: number, payload: TestAccessExtendPayload): Promise<TestAccessEntry> {
  const { data } = await apiClient.patch<TestAccessEntry>(`/promo-offers/test-access/${accessId}`, payload);
  return data;
}

export async function deactivateTestAccess(accessId: number): Promise<TestAccessEntry> {
  const { data } = await apiClient.post<TestAccessEntry>(`/promo-offers/test-access/${accessId}/deactivate`);
  return data;
}

export interface TestAccessSquad {
  id: number;
  squad_uuid: string;
  display_name: string;
  country_code?: string | null;
  is_available: boolean;
  price_kopeks: number;
  description?: string | null;
}

export interface TestAccessSquadListResponse {
  items: TestAccessSquad[];
  total: number;
  page: number;
  limit: number;
}

export async function fetchTestAccessSquads(params: { page?: number; limit?: number; available_only?: boolean } = {}) {
  const { data } = await apiClient.get<TestAccessSquadListResponse>("/promo-offers/test-access/squads", {
    params: {
      page: params.page ?? 1,
      limit: params.limit ?? 50,
      available_only: params.available_only,
    },
  });
  return data;
}
