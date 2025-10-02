import { apiClient } from "@/lib/api-client";

export interface TokenResponse {
  id: number;
  name: string;
  prefix: string;
  description?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at?: string | null;
  expires_at?: string | null;
  last_used_at?: string | null;
  last_used_ip?: string | null;
  created_by?: string | null;
}

export interface TokenCreateResponse extends TokenResponse {
  token: string;
}

export async function fetchTokens(): Promise<TokenResponse[]> {
  const { data } = await apiClient.get<TokenResponse[]>("/tokens");
  return data;
}

export async function createToken(name: string, description?: string | null, expires_at?: string | null): Promise<TokenCreateResponse> {
  const { data } = await apiClient.post<TokenCreateResponse>("/tokens", { name, description, expires_at });
  return data;
}

export async function revokeToken(id: number): Promise<TokenResponse> {
  const { data } = await apiClient.post<TokenResponse>(`/tokens/${id}/revoke`);
  return data;
}

export async function activateToken(id: number): Promise<TokenResponse> {
  const { data } = await apiClient.post<TokenResponse>(`/tokens/${id}/activate`);
  return data;
}

export async function deleteToken(id: number): Promise<void> {
  await apiClient.delete(`/tokens/${id}`);
}


