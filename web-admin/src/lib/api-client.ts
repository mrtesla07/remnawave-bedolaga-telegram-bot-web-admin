import axios from "axios";
import { defaultApiBaseUrl, defaultRequestTimeout } from "@/lib/config";
import { authStore } from "@/store/auth-store";

export const apiClient = axios.create({
  baseURL: defaultApiBaseUrl,
  timeout: defaultRequestTimeout,
});

apiClient.interceptors.request.use((config) => {
  const { token, apiBaseUrl } = authStore.getState();
  config.baseURL = apiBaseUrl || defaultApiBaseUrl;
  const headers = { ...(config.headers || {}) } as Record<string, string>;
  if (token) {
    headers.Authorization = `Bearer ${token}`;
    headers["X-API-Key"] = token;
  }
  headers["X-Requested-With"] = "BedolagaAdminUI";
  config.headers = headers;
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      authStore.getState().clear();
    }
    throw error;
  },
);


