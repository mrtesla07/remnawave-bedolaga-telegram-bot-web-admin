import { apiClient } from "@/lib/api-client";

export type PromoCodeType = "balance" | "subscription_days" | "trial_subscription";

export interface PromoCodeDto {
  id: number;
  code: string;
  type: PromoCodeType | string;
  balance_bonus_kopeks: number;
  balance_bonus_rubles?: number;
  subscription_days: number;
  max_uses: number;
  current_uses: number;
  uses_left: number;
  is_active: boolean;
  is_valid: boolean;
  valid_from: string;
  valid_until?: string | null;
  created_by?: number | null;
  created_at: string;
  updated_at: string;
}

export interface PromoCode {
  id: number;
  code: string;
  type: PromoCodeType;
  bonusRubles: number; // for balance type
  subscriptionDays: number; // for subscription types
  maxUses: number;
  currentUses: number;
  usesLeft: number;
  isActive: boolean;
  isValid: boolean;
  validFrom: string; // ISO
  validUntil?: string | null; // ISO
  createdBy?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface PromoCodeListResponse {
  items: PromoCode[];
  total: number;
  limit: number;
  offset: number;
}

export interface PromoCodeQuery {
  limit?: number;
  offset?: number;
  is_active?: boolean;
}

export interface PromoCodeCreateInput {
  code: string;
  type: PromoCodeType;
  bonusRubles?: number; // used if type = balance
  subscriptionDays?: number; // used otherwise
  maxUses?: number;
  validFrom?: string | null; // ISO
  validUntil?: string | null; // ISO
  isActive?: boolean;
  createdBy?: number | null;
}

export interface PromoCodeUpdateInput {
  code?: string;
  type?: PromoCodeType;
  bonusRubles?: number;
  subscriptionDays?: number;
  maxUses?: number;
  validFrom?: string | null;
  validUntil?: string | null;
  isActive?: boolean;
}

function mapDto(dto: PromoCodeDto): PromoCode {
  const bonusRubles = dto.balance_bonus_rubles != null
    ? dto.balance_bonus_rubles
    : Math.round((dto.balance_bonus_kopeks || 0)) / 100;
  return {
    id: dto.id,
    code: dto.code,
    type: (dto.type as PromoCodeType) || "balance",
    bonusRubles,
    subscriptionDays: dto.subscription_days ?? 0,
    maxUses: dto.max_uses ?? 0,
    currentUses: dto.current_uses ?? 0,
    usesLeft: dto.uses_left ?? Math.max(0, (dto.max_uses ?? 0) - (dto.current_uses ?? 0)),
    isActive: Boolean(dto.is_active),
    isValid: Boolean(dto.is_valid),
    validFrom: dto.valid_from,
    validUntil: dto.valid_until ?? null,
    createdBy: dto.created_by ?? null,
    createdAt: dto.created_at,
    updatedAt: dto.updated_at,
  };
}

export async function fetchPromocodes(params: PromoCodeQuery = {}): Promise<PromoCodeListResponse> {
  const { data } = await apiClient.get<{ items: PromoCodeDto[]; total: number; limit: number; offset: number }>("/promo-codes", {
    params: {
      limit: params.limit ?? 25,
      offset: params.offset ?? 0,
      is_active: params.is_active,
    },
  });
  return {
    items: (data.items ?? []).map(mapDto),
    total: data.total ?? (data.items?.length ?? 0),
    limit: data.limit ?? (params.limit ?? 25),
    offset: data.offset ?? (params.offset ?? 0),
  };
}

export async function createPromocode(input: PromoCodeCreateInput): Promise<PromoCode> {
  const payload: any = {
    code: input.code.trim().toUpperCase(),
    type: input.type,
    balance_bonus_kopeks: Math.round((input.bonusRubles ?? 0) * 100),
    subscription_days: input.subscriptionDays ?? 0,
    max_uses: input.maxUses ?? 1,
    valid_from: input.validFrom ?? null,
    valid_until: input.validUntil ?? null,
    is_active: input.isActive ?? true,
    created_by: input.createdBy ?? null,
  };

  // Normalize mutually exclusive fields by type
  if (input.type === "balance") {
    payload.subscription_days = 0;
  } else {
    payload.balance_bonus_kopeks = 0;
  }

  const { data } = await apiClient.post<PromoCodeDto>("/promo-codes", payload);
  return mapDto(data);
}

export async function updatePromocode(id: number, input: PromoCodeUpdateInput): Promise<PromoCode> {
  const payload: any = {};
  if (input.code !== undefined) payload.code = input.code.trim().toUpperCase();
  if (input.type !== undefined) payload.type = input.type;
  if (input.bonusRubles !== undefined) payload.balance_bonus_kopeks = Math.round((input.bonusRubles ?? 0) * 100);
  if (input.subscriptionDays !== undefined) payload.subscription_days = input.subscriptionDays ?? 0;
  if (input.maxUses !== undefined) payload.max_uses = input.maxUses ?? 0;
  if (input.validFrom !== undefined) payload.valid_from = input.validFrom;
  if (input.validUntil !== undefined) payload.valid_until = input.validUntil;
  if (input.isActive !== undefined) payload.is_active = input.isActive;

  const { data } = await apiClient.patch<PromoCodeDto>(`/promo-codes/${id}`, payload);
  return mapDto(data);
}

export async function deletePromocode(id: number): Promise<void> {
  await apiClient.delete(`/promo-codes/${id}`);
}


