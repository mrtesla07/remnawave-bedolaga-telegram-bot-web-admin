import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import type { PromoCodeCreateInput, PromoCodeListResponse, PromoCodeQuery, PromoCodeUpdateInput } from "./api";
import { createPromocode, deletePromocode, fetchPromocodes, updatePromocode } from "./api";

const PROMO_CODES_KEY = ["promocodes", "list"] as const;

export function usePromocodesList(initial: PromoCodeQuery = {}) {
  const [params, setParams] = useState<PromoCodeQuery>({ limit: 25, offset: 0, ...initial });

  const query = useQuery<PromoCodeListResponse, Error>({
    queryKey: [...PROMO_CODES_KEY, params],
    queryFn: () => fetchPromocodes(params),
    placeholderData: (previous) => previous,
  });

  return { ...query, params, setParams };
}

export function useCreatePromocode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: PromoCodeCreateInput) => createPromocode(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: PROMO_CODES_KEY }),
  });
}

export function useUpdatePromocode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { id: number; data: PromoCodeUpdateInput }) => updatePromocode(payload.id, payload.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: PROMO_CODES_KEY }),
  });
}

export function useDeletePromocode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deletePromocode(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: PROMO_CODES_KEY }),
  });
}


