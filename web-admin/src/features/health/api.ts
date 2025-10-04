import { apiClient } from "@/lib/api-client";

export interface HealthFeatureFlags {
  monitoring: boolean;
  maintenance: boolean;
  reporting: boolean;
  webhooks: boolean;
}

export interface HealthCheckResponse {
  status: string;
  api_version: string;
  bot_version: string;
  features: HealthFeatureFlags;
}

export async function fetchHealth(): Promise<HealthCheckResponse> {
  const { data } = await apiClient.get<HealthCheckResponse>("/health");
  return data;
}


