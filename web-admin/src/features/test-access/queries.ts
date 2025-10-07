import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import {
  deactivateTestAccess,
  extendTestAccess,
  fetchTestAccessList,
  fetchTestAccessSquads,
  type TestAccessListResponse,
  type TestAccessQuery,
  type TestAccessSquadListResponse,
  type TestAccessExtendPayload,
} from "./api";

const TEST_ACCESS_KEY = ["promo-offers", "test-access"] as const;
const TEST_ACCESS_SQUADS_KEY = ["promo-offers", "test-access", "squads"] as const;

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
    /* ignore storage errors */
  }
  return fallback;
}

function persistParams<T extends Record<string, any>>(key: string | undefined, value: T) {
  if (!key || !isBrowser) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore storage errors */
  }
}

export function useTestAccessList(initial: TestAccessQuery = {}, options: { storageKey?: string } = {}) {
  const { storageKey } = options;
  const [params, setParamsState] = useState<TestAccessQuery>(() =>
    loadStoredParams(storageKey, { limit: 25, offset: 0, ...initial }),
  );

  useEffect(() => {
    persistParams(storageKey, params);
  }, [params, storageKey]);

  const setParams = useCallback((update: TestAccessQuery | ((prev: TestAccessQuery) => TestAccessQuery)) => {
    setParamsState((prev) => {
      const next = typeof update === "function" ? (update as (prev: TestAccessQuery) => TestAccessQuery)(prev) : update;
      return { ...prev, ...next };
    });
  }, []);

  const query = useQuery<TestAccessListResponse, Error>({
    queryKey: [...TEST_ACCESS_KEY, params],
    queryFn: () => fetchTestAccessList(params),
    placeholderData: (previous) => previous,
  });

  return { ...query, params, setParams };
}

export function useExtendTestAccess() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: TestAccessExtendPayload }) => extendTestAccess(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: TEST_ACCESS_KEY });
    },
  });
}

export function useDeactivateTestAccess() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deactivateTestAccess(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: TEST_ACCESS_KEY });
    },
  });
}

export function useTestAccessSquads(params: { page?: number; limit?: number; available_only?: boolean } = {}) {
  return useQuery<TestAccessSquadListResponse, Error>({
    queryKey: [...TEST_ACCESS_SQUADS_KEY, params],
    queryFn: () => fetchTestAccessSquads(params),
    placeholderData: (previous) => previous,
  });
}
