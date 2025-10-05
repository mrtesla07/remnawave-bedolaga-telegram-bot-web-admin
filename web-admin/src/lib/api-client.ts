import axios from "axios";
import { defaultApiBaseUrl, defaultRequestTimeout } from "@/lib/config";
import { authStore } from "@/store/auth-store";

export function normalizeBaseUrl(url: string | undefined): string {
  const raw = (url || defaultApiBaseUrl || "").trim().replace(/\/+$/, "");
  if (!raw) return "";
  if (!/^https?:\/\//i.test(raw)) return `http://${raw}`;
  return raw;
}

export const apiClient = axios.create({
  baseURL: normalizeBaseUrl(defaultApiBaseUrl),
  timeout: defaultRequestTimeout,
});

function forceLogout() {
  const store = authStore.getState();
  store.setJwtToken(null);
  store.setUsername(null);
  store.setName(null);
  store.setToken(null);
  try {
    if (typeof window !== 'undefined') {
      const current = String(window.location?.pathname || '');
      if (current !== '/auth') window.location.assign('/auth');
    }
  } catch {}
}

apiClient.interceptors.request.use((config) => {
  const { token, jwtToken, apiBaseUrl } = authStore.getState();
  config.baseURL = normalizeBaseUrl(apiBaseUrl || defaultApiBaseUrl);
  const headers = { ...(config.headers || {}) } as Record<string, string>;
  const rawUrl = String(config.url || "");
  let isAuthPath = false;
  try {
    const base = normalizeBaseUrl(apiBaseUrl || defaultApiBaseUrl) || window.location.origin;
    const u = new URL(rawUrl, base);
    isAuthPath = u.pathname.startsWith("/auth");
  } catch {
    isAuthPath = rawUrl.startsWith("/auth") || rawUrl.startsWith("auth/");
  }
  // Prefer Bearer JWT for all endpoints if available; fall back to legacy X-API-Key
  const hasAuthHeader = !!(headers as any).Authorization;
  if (!hasAuthHeader && jwtToken) {
    headers.Authorization = `Bearer ${jwtToken}`;
  }
  if (!jwtToken && token) headers["X-API-Key"] = token;
  headers["X-Requested-With"] = "BedolagaAdminUI";
  config.headers = headers;
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 404 || error.response?.status === 403) {
      const cfg = error.config || {};
      const rawUrl = String(cfg.url || '');
      let path = rawUrl;
      try {
        const base = normalizeBaseUrl(authStore.getState().apiBaseUrl || defaultApiBaseUrl) || window.location.origin;
        path = new URL(rawUrl, base).pathname;
      } catch {}
      if (path === '/auth/me') {
        forceLogout();
      }
    }

    if (error.response?.status === 401) {
      const cfg = error.config || {};
      const rawUrl = String(cfg.url || "");
      let isAuthPath = false;
      try {
        const base = normalizeBaseUrl(authStore.getState().apiBaseUrl || defaultApiBaseUrl) || window.location.origin;
        const u = new URL(rawUrl, base);
        isAuthPath = u.pathname.startsWith("/auth");
      } catch {
        isAuthPath = rawUrl.startsWith("/auth") || rawUrl.startsWith("auth/");
      }

      if (!isAuthPath) {
        // Treat as unauthorized
        forceLogout();
      }
    }
    if (error.response?.status === 403) {
      // Дополнительно можно обработать запреты регистрации и т.п.
    }
    throw error;
  },
);


