import { useQuery } from "@tanstack/react-query";
import { fetchHealth } from "./api";

export function useHealth() {
  return useQuery({ queryKey: ["health"], queryFn: fetchHealth, staleTime: 30_000, refetchInterval: 60_000 });
}


