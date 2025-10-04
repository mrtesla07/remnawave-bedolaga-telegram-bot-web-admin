import { useQuery } from "@tanstack/react-query";
import { fetchOverviewStats, fetchRemnawaveSystem, fetchRevenueTrend, fetchServers } from "./api";

export function useRemnawaveSystem() {
  return useQuery({
    queryKey: ["remnawave", "system"],
    queryFn: fetchRemnawaveSystem,
    staleTime: 60_000,
    refetchInterval: 60_000,
  });
}

export function useOverviewStats() {
  return useQuery({
    queryKey: ["stats", "overview"],
    queryFn: fetchOverviewStats,
    staleTime: 60_000,
  });
}

export function useRevenueTrend() {
  return useQuery({
    queryKey: ["stats", "revenue-trend"],
    queryFn: fetchRevenueTrend,
    staleTime: 60_000,
  });
}

export function useServers() {
  return useQuery({
    queryKey: ["remnawave", "servers"],
    queryFn: fetchServers,
    staleTime: 60_000,
    refetchInterval: 60_000,
  });
}

