import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchSettingCategories, fetchSettings, resetSetting, updateSetting } from "./api";

export function useSettingCategories() {
  return useQuery({ queryKey: ["settings", "categories"], queryFn: fetchSettingCategories, staleTime: 60_000 });
}

export function useSettings(categoryKey?: string) {
  return useQuery({ queryKey: ["settings", { categoryKey: categoryKey || null }], queryFn: () => fetchSettings(categoryKey), staleTime: 30_000 });
}

export function useUpdateSetting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ key, value }: { key: string; value: unknown }) => updateSetting(key, value),
    onSuccess: (def) => {
      qc.invalidateQueries({ queryKey: ["settings"] });
      qc.invalidateQueries({ queryKey: ["settings", { categoryKey: def.category.key }] });
    },
  });
}

export function useResetSetting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (key: string) => resetSetting(key),
    onSuccess: (def) => {
      qc.invalidateQueries({ queryKey: ["settings"] });
      qc.invalidateQueries({ queryKey: ["settings", { categoryKey: def.category.key }] });
    },
  });
}


