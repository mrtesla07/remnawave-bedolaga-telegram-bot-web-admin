import axios from "axios";
import { defaultApiBaseUrl, defaultRequestTimeout } from "@/lib/config";
import { authStore } from "@/store/auth-store";

function normalizeBaseUrl(url: string | undefined): string {
  const raw = (url || defaultApiBaseUrl || "").trim().replace(/\/+$/, "");
  if (!raw) return "";
  if (!/^https?:\/\//i.test(raw)) return `http://${raw}`;
  return raw;
}

export const apiClient = axios.create({
  baseURL: normalizeBaseUrl(defaultApiBaseUrl),
  timeout: defaultRequestTimeout,
});

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
  // Send JWT only for /auth endpoints (e.g., /auth/me). For API endpoints rely on X-API-Key.
  const hasAuthHeader = !!(headers as any).Authorization;
  if (!hasAuthHeader) {
    if (isAuthPath && jwtToken) {
      headers.Authorization = `Bearer ${jwtToken}`;
    }
  }
  if (token) headers["X-API-Key"] = token;
  headers["X-Requested-With"] = "BedolagaAdminUI";
  config.headers = headers;
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
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

      const { token, jwtToken } = authStore.getState();
      if (isAuthPath) {
        // Не вмешиваемся в JWT автоматически. Страница авторизации сама обновит токен при логине.
      } else {
        // Для обычных API: если JWT есть, но токена нет — оставляем как есть (пусть откроется диалог токена)
        if (jwtToken && !token) {
          // no-op
        } else {
          // иначе сбросим только X-API-Key
          authStore.setState({ token: null });
        }
      }
    }
    if (error.response?.status === 403) {
      // Дополнительно можно обработать запреты регистрации и т.п.
    }
    throw error;
  },
);


