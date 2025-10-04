import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { activateToken, createToken, deleteToken, fetchTokens, revokeToken } from "./api";

export function useTokens() {
  return useQuery({ queryKey: ["tokens"], queryFn: fetchTokens, staleTime: 30_000, refetchInterval: 60_000 });
}

export function useCreateToken() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ name, description, expires_at }: { name: string; description?: string | null; expires_at?: string | null }) =>
      createToken(name, description, expires_at),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tokens"] }),
  });
}

export function useRevokeToken() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: number) => revokeToken(id), onSuccess: () => qc.invalidateQueries({ queryKey: ["tokens"] }) });
}

export function useActivateToken() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: number) => activateToken(id), onSuccess: () => qc.invalidateQueries({ queryKey: ["tokens"] }) });
}

export function useDeleteToken() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: number) => deleteToken(id), onSuccess: () => qc.invalidateQueries({ queryKey: ["tokens"] }) });
}


