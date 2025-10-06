import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import type { PromoOfferCreateInput, PromoOfferListResponse, PromoOfferLogsListResponse, PromoOfferLogsQuery, PromoOfferQuery } from "./api";
import { createPromoOffer, createPromoOfferTemplate, fetchPromoOfferLogs, fetchPromoOfferTemplates, fetchPromoOffers, updatePromoOfferTemplate } from "./api";

const PROMO_OFFERS_KEY = ["promo-offers", "list"] as const;
const PROMO_OFFER_LOGS_KEY = ["promo-offers", "logs"] as const;
const PROMO_OFFER_TEMPLATES_KEY = ["promo-offers", "templates"] as const;

export function usePromoOffersList(initial: PromoOfferQuery = {}) {
  const [params, setParams] = useState<PromoOfferQuery>({ limit: 25, offset: 0, ...initial });

  const query = useQuery<PromoOfferListResponse>({
    queryKey: [...PROMO_OFFERS_KEY, params],
    queryFn: () => fetchPromoOffers(params),
    keepPreviousData: true,
  });

  return { ...query, params, setParams };
}

export function useCreatePromoOffer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: PromoOfferCreateInput) => createPromoOffer(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: PROMO_OFFERS_KEY }),
  });
}

export function usePromoOfferLogs(initial: PromoOfferLogsQuery = {}) {
  const [params, setParams] = useState<PromoOfferLogsQuery>({ limit: 25, offset: 0, ...initial });

  const query = useQuery<PromoOfferLogsListResponse>({
    queryKey: [...PROMO_OFFER_LOGS_KEY, params],
    queryFn: () => fetchPromoOfferLogs(params),
    keepPreviousData: true,
  });

  return { ...query, params, setParams };
}

export function usePromoOfferTemplates() {
  return useQuery({
    queryKey: PROMO_OFFER_TEMPLATES_KEY,
    queryFn: () => fetchPromoOfferTemplates(),
  });
}

export function useCreatePromoOfferTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: any) => createPromoOfferTemplate(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: PROMO_OFFER_TEMPLATES_KEY }),
  });
}

export function useUpdatePromoOfferTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { id: number; data: any }) => updatePromoOfferTemplate(payload.id, payload.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: PROMO_OFFER_TEMPLATES_KEY }),
  });
}


