import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { addDevicesToSubscription, addTrafficToSubscription, extendSubscription, fetchSubscriptions } from "./api";
import type { SubscriptionsListResponse } from "./api";

const SUBSCRIPTIONS_QUERY_KEY = ["subscriptions", "list"] as const;

export function useSubscriptionsList(initial: Record<string, unknown> = {}) {
  const [params, setParams] = useState<Record<string, unknown>>({ limit: 25, offset: 0, ...initial });

  const query = useQuery<SubscriptionsListResponse, Error>({
    queryKey: [...SUBSCRIPTIONS_QUERY_KEY, params],
    queryFn: () => fetchSubscriptions(params as any),
    placeholderData: (previous) => previous,
  });

  return {
    ...query,
    params,
    setParams,
  };
}

export function useExtendSubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { id: number; days: number }) => extendSubscription(payload.id, payload.days),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["subscriptions", "list"] }),
  });
}

export function useAddTraffic() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { id: number; gigabytes: number }) => addTrafficToSubscription(payload.id, payload.gigabytes),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["subscriptions", "list"] }),
  });
}

export function useAddDevices() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { id: number; devices: number }) => addDevicesToSubscription(payload.id, payload.devices),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["subscriptions", "list"] }),
  });
}


