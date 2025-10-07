import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import type {
  PromoOffer,
  PromoOfferCreateInput,
  PromoOfferListResponse,
  PromoOfferLogsListResponse,
  PromoOfferLogsQuery,
  PromoOfferQuery,
  PromoOfferTemplateDto,
} from "./api";
import { activatePromoOffer, bulkSendPromoOffers, clearPromoOfferLogs, createPromoOffer, createPromoOfferTemplate, deletePromoOffer, deletePromoOfferTemplate, fetchPromoOffer, fetchPromoOfferLogs, fetchPromoOfferTemplates, fetchPromoOffers, updatePromoOfferTemplate } from "./api";

const PROMO_OFFERS_KEY = ["promo-offers", "list"] as const;
const PROMO_OFFER_LOGS_KEY = ["promo-offers", "logs"] as const;
const PROMO_OFFER_TEMPLATES_KEY = ["promo-offers", "templates"] as const;

export function usePromoOffersList(initial: PromoOfferQuery = {}) {
  const [params, setParams] = useState<PromoOfferQuery>({ limit: 25, offset: 0, ...initial });

  const query = useQuery<PromoOfferListResponse, Error>({
    queryKey: [...PROMO_OFFERS_KEY, params],
    queryFn: () => fetchPromoOffers(params),
    placeholderData: (previous) => previous,
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

export function useDeletePromoOffer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deletePromoOffer(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: PROMO_OFFERS_KEY }),
  });
}

export function usePromoOfferDetails(id: number | null) {
  return useQuery<PromoOffer, Error>({
    queryKey: ["promo-offers", "detail", id],
    queryFn: () => (id ? fetchPromoOffer(id) : Promise.reject("No id")),
    enabled: Boolean(id),
  });
}

export function useActivatePromoOffer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => activatePromoOffer(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: PROMO_OFFERS_KEY }),
  });
}

export function usePromoOfferLogs(initial: PromoOfferLogsQuery = {}) {
  const [params, setParams] = useState<PromoOfferLogsQuery>({ limit: 25, offset: 0, ...initial });

  const query = useQuery<PromoOfferLogsListResponse, Error>({
    queryKey: [...PROMO_OFFER_LOGS_KEY, params],
    queryFn: () => fetchPromoOfferLogs(params),
    placeholderData: (previous) => previous,
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

export function useDeletePromoOfferTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deletePromoOfferTemplate(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: PROMO_OFFER_TEMPLATES_KEY }),
  });
}

export function useBulkSendPromoOffers() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: any) => bulkSendPromoOffers(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PROMO_OFFERS_KEY });
    },
  });
}

export function useClearPromoOfferLogs() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (filters: PromoOfferLogsQuery) => clearPromoOfferLogs(filters),
    onSuccess: () => qc.invalidateQueries({ queryKey: PROMO_OFFER_LOGS_KEY }),
  });
}


