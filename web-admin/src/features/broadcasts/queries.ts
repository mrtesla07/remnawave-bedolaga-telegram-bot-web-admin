import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { BroadcastCreatePayload, BroadcastItem, BroadcastListResponse } from "./api";
import { createBroadcast, fetchBroadcasts, stopBroadcast } from "./api";

const BROADCASTS_KEY = ["broadcasts", "list"] as const;

export function useBroadcastsList(initial: { limit?: number; offset?: number } = {}) {
  const params = { limit: initial.limit ?? 50, offset: initial.offset ?? 0 };
  const query = useQuery<BroadcastListResponse>({ queryKey: [...BROADCASTS_KEY, params], queryFn: () => fetchBroadcasts(params), keepPreviousData: true });
  return query;
}

export function useCreateBroadcast() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (payload: BroadcastCreatePayload) => createBroadcast(payload), onSuccess: () => { qc.invalidateQueries({ queryKey: BROADCASTS_KEY }); } });
}

export function useStopBroadcast() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: number) => stopBroadcast(id), onSuccess: () => { qc.invalidateQueries({ queryKey: BROADCASTS_KEY }); } });
}
