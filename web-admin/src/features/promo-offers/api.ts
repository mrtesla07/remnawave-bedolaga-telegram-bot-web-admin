import { apiClient } from "@/lib/api-client";

export interface PromoOfferUserInfo {
  id: number;
  telegram_id: number;
  username?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  full_name?: string | null;
}

export interface PromoOfferSubscriptionInfo {
  id: number;
  autopay_enabled: boolean;
}

export interface PromoOfferDto {
  id: number;
  user_id: number;
  subscription_id?: number | null;
  notification_type: string;
  discount_percent: number;
  bonus_amount_kopeks: number;
  expires_at: string; // ISO
  claimed_at?: string | null; // ISO
  is_active: boolean;
  effect_type: string;
  extra_data: Record<string, any>;
  created_at: string; // ISO
  updated_at: string; // ISO
  user?: PromoOfferUserInfo | null;
  subscription?: PromoOfferSubscriptionInfo | null;
}

export interface PromoOfferListResponseDto {
  items: PromoOfferDto[];
  total: number;
  limit: number;
  offset: number;
}

export interface PromoOffer {
  id: number;
  userId: number;
  subscriptionId?: number | null;
  notificationType: string;
  discountPercent: number;
  bonusRubles: number;
  expiresAt: string;
  claimedAt?: string | null;
  isActive: boolean;
  effectType: string;
  extraData: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  user?: PromoOfferUserInfo | null;
}

export interface PromoOfferQuery {
  limit?: number;
  offset?: number;
  user_id?: number;
  notification_type?: string;
  is_active?: boolean;
}

export interface PromoOfferCreateInput {
  user_id: number;
  notification_type: string;
  valid_hours: number;
  discount_percent?: number;
  bonus_amount_kopeks?: number;
  subscription_id?: number | null;
  effect_type?: string;
  extra_data?: Record<string, any>;
}

export interface PromoOfferListResponse {
  items: PromoOffer[];
  total: number;
  limit: number;
  offset: number;
}

function mapDto(dto: PromoOfferDto): PromoOffer {
  return {
    id: dto.id,
    userId: dto.user_id,
    subscriptionId: dto.subscription_id ?? null,
    notificationType: dto.notification_type,
    discountPercent: dto.discount_percent ?? 0,
    bonusRubles: Math.round((dto.bonus_amount_kopeks || 0)) / 100,
    expiresAt: dto.expires_at,
    claimedAt: dto.claimed_at ?? null,
    isActive: Boolean(dto.is_active),
    effectType: dto.effect_type,
    extraData: dto.extra_data || {},
    createdAt: dto.created_at,
    updatedAt: dto.updated_at,
    user: dto.user ?? null,
  };
}

export async function fetchPromoOffers(params: PromoOfferQuery = {}): Promise<PromoOfferListResponse> {
  const { data } = await apiClient.get<PromoOfferListResponseDto>("/promo-offers", {
    params: {
      limit: params.limit ?? 25,
      offset: params.offset ?? 0,
      user_id: params.user_id,
      notification_type: params.notification_type,
      is_active: params.is_active,
    },
  });
  return {
    items: (data.items || []).map(mapDto),
    total: data.total ?? (data.items?.length ?? 0),
    limit: data.limit ?? (params.limit ?? 25),
    offset: data.offset ?? (params.offset ?? 0),
  };
}

export async function createPromoOffer(input: PromoOfferCreateInput): Promise<PromoOffer> {
  const payload: any = {
    user_id: input.user_id,
    notification_type: input.notification_type.trim(),
    valid_hours: Math.max(1, Math.floor(input.valid_hours)),
    discount_percent: Math.max(0, Math.floor(input.discount_percent ?? 0)),
    bonus_amount_kopeks: Math.max(0, Math.floor(input.bonus_amount_kopeks ?? 0)),
    subscription_id: input.subscription_id ?? null,
    effect_type: (input.effect_type || "percent_discount").trim(),
    extra_data: input.extra_data || {},
  };
  const { data } = await apiClient.post<PromoOfferDto>("/promo-offers", payload);
  return mapDto(data);
}

export interface PromoOfferLogOfferInfo {
  id?: number | null;
  notification_type?: string | null;
  discount_percent?: number | null;
}

export interface PromoOfferLogResponse {
  id: number;
  user_id: number;
  offer_id?: number | null;
  action: string;
  source?: string | null;
  percent?: number | null;
  effect_type?: string | null;
  details?: Record<string, any> | null;
  created_at: string;
  user?: PromoOfferUserInfo | null;
  offer?: PromoOfferLogOfferInfo | null;
}

export interface PromoOfferLogsListResponse {
  items: PromoOfferLogResponse[];
  total: number;
  limit: number;
  offset: number;
}

export interface PromoOfferLogsQuery {
  limit?: number;
  offset?: number;
  user_id?: number;
  offer_id?: number;
  action?: string;
  source?: string;
}

export async function fetchPromoOfferLogs(params: PromoOfferLogsQuery = {}): Promise<PromoOfferLogsListResponse> {
  const { data } = await apiClient.get<PromoOfferLogsListResponse>("/promo-offers/logs", {
    params: {
      limit: params.limit ?? 25,
      offset: params.offset ?? 0,
      user_id: params.user_id,
      offer_id: params.offer_id,
      action: params.action,
      source: params.source,
    },
  });
  return {
    items: data.items || [],
    total: data.total ?? (data.items?.length ?? 0),
    limit: data.limit ?? (params.limit ?? 25),
    offset: data.offset ?? (params.offset ?? 0),
  };
}

export interface PromoOfferTemplateDto {
  id: number;
  name: string;
  offer_type: string;
  message_text: string;
  button_text: string;
  valid_hours: number;
  discount_percent: number;
  bonus_amount_kopeks: number;
  active_discount_hours?: number | null;
  test_duration_hours?: number | null;
  test_squad_uuids: string[];
  is_active: boolean;
  created_by?: number | null;
  created_at: string;
  updated_at: string;
}

export async function fetchPromoOfferTemplates(): Promise<PromoOfferTemplateDto[]> {
  const { data } = await apiClient.get<{ items: PromoOfferTemplateDto[] }>("/promo-offers/templates");
  return data.items || [];
}

export async function updatePromoOfferTemplate(id: number, payload: Partial<PromoOfferTemplateDto>): Promise<PromoOfferTemplateDto> {
  const { data } = await apiClient.patch<PromoOfferTemplateDto>(`/promo-offers/templates/${id}`, payload);
  return data;
}

export async function createPromoOfferTemplate(payload: Partial<PromoOfferTemplateDto> & { name: string; offer_type: string; message_text: string; button_text: string; valid_hours: number; }): Promise<PromoOfferTemplateDto> {
  const { data } = await apiClient.post<PromoOfferTemplateDto>("/promo-offers/templates", payload);
  return data;
}

export function toKopeks(rubles: number | undefined): number {
  return Math.max(0, Math.floor((rubles ?? 0) * 100));
}

export function fromKopeks(kopeks: number | undefined): number {
  return Math.round((kopeks || 0)) / 100;
}


