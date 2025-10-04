import { apiClient } from "@/lib/api-client";

export interface PromoGroupDto {
  id: number;
  name: string;
  server_discount_percent: number;
  traffic_discount_percent: number;
  device_discount_percent: number;
  period_discounts: Record<number, number>;
  auto_assign_total_spent_kopeks: number | null;
  apply_discounts_to_addons: boolean;
  is_default: boolean;
  members_count: number;
  created_at: string;
  updated_at: string;
}

export interface PromoGroup {
  id: number;
  name: string;
  serverDiscountPercent: number;
  trafficDiscountPercent: number;
  deviceDiscountPercent: number;
  periodDiscounts: Record<number, number>;
  autoAssignThresholdRubles: number | null;
  applyDiscountsToAddons: boolean;
  isDefault: boolean;
  membersCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PromoGroupListResponse {
  items: PromoGroup[];
  total: number;
  limit: number;
  offset: number;
}

export interface PromoGroupQuery {
  limit?: number;
  offset?: number;
}

export interface PromoGroupInput {
  name: string;
  serverDiscountPercent: number;
  trafficDiscountPercent: number;
  deviceDiscountPercent: number;
  periodDiscounts: Record<number, number>;
  autoAssignThresholdRubles: number | null;
  applyDiscountsToAddons: boolean;
  isDefault: boolean;
}

function mapDto(dto: PromoGroupDto): PromoGroup {
  return {
    id: dto.id,
    name: dto.name,
    serverDiscountPercent: dto.server_discount_percent ?? 0,
    trafficDiscountPercent: dto.traffic_discount_percent ?? 0,
    deviceDiscountPercent: dto.device_discount_percent ?? 0,
    periodDiscounts: dto.period_discounts ?? {},
    autoAssignThresholdRubles: dto.auto_assign_total_spent_kopeks != null ? Math.round(dto.auto_assign_total_spent_kopeks) / 100 : null,
    applyDiscountsToAddons: Boolean(dto.apply_discounts_to_addons),
    isDefault: Boolean(dto.is_default),
    membersCount: dto.members_count ?? 0,
    createdAt: dto.created_at,
    updatedAt: dto.updated_at,
  };
}

export async function fetchPromoGroups(params: PromoGroupQuery = {}): Promise<PromoGroupListResponse> {
  const { data } = await apiClient.get<{ items: PromoGroupDto[]; total: number; limit: number; offset: number }>("/promo-groups", {
    params: {
      limit: params.limit ?? 25,
      offset: params.offset ?? 0,
    },
  });

  return {
    items: (data.items ?? []).map(mapDto),
    total: data.total,
    limit: data.limit,
    offset: data.offset,
  };
}

export async function createPromoGroup(payload: PromoGroupInput): Promise<PromoGroup> {
  const { data } = await apiClient.post<PromoGroupDto>("/promo-groups", {
    name: payload.name,
    server_discount_percent: payload.serverDiscountPercent,
    traffic_discount_percent: payload.trafficDiscountPercent,
    device_discount_percent: payload.deviceDiscountPercent,
    period_discounts: payload.periodDiscounts,
    auto_assign_total_spent_kopeks: payload.autoAssignThresholdRubles != null ? Math.round(payload.autoAssignThresholdRubles * 100) : null,
    apply_discounts_to_addons: payload.applyDiscountsToAddons,
    is_default: payload.isDefault,
  });
  return mapDto(data);
}

export async function updatePromoGroup(id: number, payload: Partial<PromoGroupInput>): Promise<PromoGroup> {
  const { data } = await apiClient.patch<PromoGroupDto>(`/promo-groups/${id}`, {
    name: payload.name,
    server_discount_percent: payload.serverDiscountPercent,
    traffic_discount_percent: payload.trafficDiscountPercent,
    device_discount_percent: payload.deviceDiscountPercent,
    period_discounts: payload.periodDiscounts,
    auto_assign_total_spent_kopeks:
      payload.autoAssignThresholdRubles != null ? Math.round(payload.autoAssignThresholdRubles * 100) : payload.autoAssignThresholdRubles,
    apply_discounts_to_addons: payload.applyDiscountsToAddons,
    is_default: payload.isDefault,
  });
  return mapDto(data);
}

export async function deletePromoGroup(id: number): Promise<void> {
  await apiClient.delete(`/promo-groups/${id}`);
}


