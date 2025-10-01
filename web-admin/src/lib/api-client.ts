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
  if (token) {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`,
    };
  }
  config.headers = {
    "X-Requested-With": "BedolagaAdminUI",
    ...config.headers,
  };
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


