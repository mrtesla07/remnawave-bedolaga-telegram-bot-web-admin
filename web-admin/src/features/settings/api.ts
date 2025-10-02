import { apiClient } from "@/lib/api-client";

export interface SettingCategorySummary {
  key: string;
  label: string;
  items: number;
}

export interface SettingChoice {
  value: string | number | boolean | null;
  label: string;
  description?: string | null;
}

export interface SettingDefinition {
  key: string;
  name: string;
  category: { key: string; label: string };
  type: string;
  is_optional: boolean;
  current: unknown;
  original: unknown;
  has_override: boolean;
  choices: SettingChoice[];
}

export async function fetchSettingCategories(): Promise<SettingCategorySummary[]> {
  const { data } = await apiClient.get<SettingCategorySummary[]>("/settings/categories");
  return data;
}

export async function fetchSettings(categoryKey?: string): Promise<SettingDefinition[]> {
  const { data } = await apiClient.get<SettingDefinition[]>("/settings", {
    params: { category_key: categoryKey || undefined },
  });
  return data;
}

export async function updateSetting(key: string, value: unknown): Promise<SettingDefinition> {
  const { data } = await apiClient.put<SettingDefinition>(`/settings/${encodeURIComponent(key)}`, { value });
  return data;
}

export async function resetSetting(key: string): Promise<SettingDefinition> {
  const { data } = await apiClient.delete<SettingDefinition>(`/settings/${encodeURIComponent(key)}`);
  return data;
}


