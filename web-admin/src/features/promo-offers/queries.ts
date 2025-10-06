import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import type { PromoOfferCreateInput, PromoOfferListResponse, PromoOfferLogsListResponse, PromoOfferLogsQuery, PromoOfferQuery } from "./api";
import { createPromoOffer, createPromoOfferTemplate, deletePromoOffer, fetchPromoOfferLogs, fetchPromoOfferTemplates, fetchPromoOffers, updatePromoOfferTemplate } from "./api";

const PROMO_OFFERS_KEY = ["promo-offers", "list"] as const;
const PROMO_OFFER_LOGS_KEY = ["promo-offers", "logs"] as const;
const PROMO_OFFER_TEMPLATES_KEY = ["promo-offers", "templates"] as const;

const isBrowser = typeof window !== "undefined";

function loadStoredParams<T extends Record<string, any>>(key: string | undefined, fallback: T): T {
  if (!key || !isBrowser) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<T>;
    if (parsed && typeof parsed === "object") {
      return { ...fallback, ...parsed };
    }
  } catch {
    // ignore malformed storage
  }
  return fallback;
}

function persistParams<T extends Record<string, any>>(key: string | undefined, value: T) {
  if (!key || !isBrowser) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore storage errors
  }
}

export function usePromoOffersList(initial: PromoOfferQuery = {}, options: { storageKey?: string } = {}) {
  const { storageKey } = options;
  const [params, setParamsState] = useState<PromoOfferQuery>(() =>
    loadStoredParams(storageKey, { limit: 25, offset: 0, ...initial }),
  );

  useEffect(() => {
    persistParams(storageKey, params);
  }, [params, storageKey]);

  const setParams = useCallback((update: PromoOfferQuery | ((prev: PromoOfferQuery) => PromoOfferQuery)) => {
    setParamsState((prev) => {
      const next = typeof update === "function" ? (update as (prev: PromoOfferQuery) => PromoOfferQuery)(prev) : update;
      return { ...next };
    });
  }, []);

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

export function useDeletePromoOffer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deletePromoOffer(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: PROMO_OFFERS_KEY }),
  });
}

export function usePromoOfferLogs(initial: PromoOfferLogsQuery = {}, options: { storageKey?: string } = {}) {
  const { storageKey } = options;
  const [params, setParamsState] = useState<PromoOfferLogsQuery>(() =>
    loadStoredParams(storageKey, { limit: 25, offset: 0, ...initial }),
  );

  useEffect(() => {
    persistParams(storageKey, params);
  }, [params, storageKey]);

  const setParams = useCallback((update: PromoOfferLogsQuery | ((prev: PromoOfferLogsQuery) => PromoOfferLogsQuery)) => {
    setParamsState((prev) => {
      const next = typeof update === "function" ? (update as (prev: PromoOfferLogsQuery) => PromoOfferLogsQuery)(prev) : update;
      return { ...next };
    });
  }, []);

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


