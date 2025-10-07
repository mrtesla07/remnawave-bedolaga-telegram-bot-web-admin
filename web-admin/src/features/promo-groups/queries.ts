import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import type { PromoGroupInput, PromoGroupListResponse, PromoGroupQuery } from "./api";
import { createPromoGroup, deletePromoGroup, fetchPromoGroups, updatePromoGroup } from "./api";

const PROMO_GROUPS_KEY = ["promo-groups", "list"] as const;

export function usePromoGroupsList(initial: PromoGroupQuery = {}) {
  const [params, setParams] = useState<PromoGroupQuery>({ limit: 25, offset: 0, ...initial });

  const query = useQuery<PromoGroupListResponse, Error>({
    queryKey: [...PROMO_GROUPS_KEY, params],
    queryFn: () => fetchPromoGroups(params),
    placeholderData: (previous) => previous,
  });

  return {
    ...query,
    params,
    setParams,
  };
}

export function useCreatePromoGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: PromoGroupInput) => createPromoGroup(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: PROMO_GROUPS_KEY }),
  });
}

export function useUpdatePromoGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { id: number; data: Partial<PromoGroupInput> }) => updatePromoGroup(payload.id, payload.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: PROMO_GROUPS_KEY }),
  });
}

export function useDeletePromoGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deletePromoGroup(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: PROMO_GROUPS_KEY }),
  });
}


