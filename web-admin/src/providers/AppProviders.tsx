import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, type ReactNode } from "react";
import { authStore, useAuthStore } from "@/store/auth-store";
import { apiClient } from "@/lib/api-client";
import { defaultApiBaseUrl } from "@/lib/config";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
    mutations: {
      retry: 1,
    },
  },
});

interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <SessionManager />
      <AuthIntegrityWatcher />
      <EventsBridge />
      {children}
    </QueryClientProvider>
  );
}

function AuthIntegrityWatcher() {
  const jwtToken = useAuthStore((s) => s.jwtToken);
  const hydrated = useAuthStore((s) => s.hydrated);
  const lastCheckedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!hydrated) return;
    if (!jwtToken) {
      lastCheckedRef.current = null;
      return;
    }
    if (lastCheckedRef.current === jwtToken) return;

    let cancelled = false;
    const controller = new AbortController();
    lastCheckedRef.current = jwtToken;

    (async () => {
      try {
        await apiClient.get("/auth/me", { signal: controller.signal });
      } catch (err) {
        if (cancelled) return;
        lastCheckedRef.current = null;
        const status = (err as any)?.response?.status;
        if (status === 401 || status === 404) {
          try {
            const store = authStore.getState();
            store.clear();
            store.setToken(null);
          } catch {}
        }
      }
    })();

    return () => {
      cancelled = true;
      try { controller.abort(); } catch {}
    };
  }, [hydrated, jwtToken]);

  return null;
}

function EventsBridge() {
  const qc = useQueryClient();
  useEffect(() => {
    let es: EventSource | null = null;
    let lastKey = "";
    let pollTimer: number | null = null;

    const startPolling = () => {
      if (pollTimer) return;
      // Lightweight safety net: periodically refresh active ticket queries
      pollTimer = window.setInterval(() => {
        qc.refetchQueries({ predicate: (q) => Array.isArray(q.queryKey) && q.queryKey[0] === "tickets", type: "active" });
      }, 5000);
    };

    const stopPolling = () => {
      if (pollTimer) {
        try { window.clearInterval(pollTimer); } catch {}
        pollTimer = null;
      }
    };

    const connect = () => {
      const { token, apiBaseUrl } = authStore.getState();
      const base = String(apiBaseUrl || defaultApiBaseUrl || "").replace(/\/+$/, "");
      const apiParam = token || null;
      if (!apiParam) {
        // No API token: do not keep SSE/polling; UI will request token
        stopPolling();
        return;
      }
      const url = `${base}/notifications/events?api_key=${encodeURIComponent(apiParam)}`;
      const key = url;
      if (lastKey === key && es) return; // already connected
      if (es) {
        try { es.close(); } catch {}
        es = null;
      }
      lastKey = key;
      es = new EventSource(url, { withCredentials: false });
      es.onopen = () => {
        stopPolling();
      };
      es.onmessage = (ev) => {
        const data = ev.data || "";
        // simple routing by prefixes
        if (data.startsWith("ticket.")) {
          // Invalidate any query whose key starts with ["tickets", ...]
          qc.invalidateQueries({ predicate: (q) => Array.isArray(q.queryKey) && q.queryKey[0] === "tickets" });
          qc.refetchQueries({ predicate: (q) => Array.isArray(q.queryKey) && q.queryKey[0] === "tickets", type: "active" });
        }
        if (
          data.startsWith("ticket.message:") ||
          data.startsWith("ticket.status:") ||
          data.startsWith("ticket.priority:") ||
          data.startsWith("ticket.block:")
        ) {
          const id = Number(data.split(":")[1]);
          if (id) {
            qc.invalidateQueries({ queryKey: ["tickets", "detail", id] });
            qc.refetchQueries({ queryKey: ["tickets", "detail", id], type: "active" });
          }
        }
        if (data.startsWith("transactions.")) {
          qc.invalidateQueries({ queryKey: ["finance", "transactions"] });
        }
        if (data.startsWith("users.")) {
          qc.invalidateQueries({ queryKey: ["users"] });
          qc.invalidateQueries({ queryKey: ["users", "list"] });
        }
        if (data.startsWith("subscriptions.")) {
          qc.invalidateQueries({ queryKey: ["subscriptions", "list"] });
        }
        if (data.startsWith("promo_groups.")) {
          qc.invalidateQueries({ queryKey: ["promo-groups", "list"] });
        }
        if (data.startsWith("promocodes.")) {
          qc.invalidateQueries({ queryKey: ["promocodes", "list"] });
        }
        if (data.startsWith("tokens.")) {
          qc.invalidateQueries({ queryKey: ["tokens"] });
        }
        if (data.startsWith("settings.")) {
          qc.invalidateQueries({ queryKey: ["settings"] });
          qc.invalidateQueries({ predicate: (q) => Array.isArray(q.queryKey) && q.queryKey[0] === "settings" });
        }
        if (data.startsWith("broadcasts.")) {
          qc.invalidateQueries({ queryKey: ["broadcasts", "list"] });
        }
      };
      es.onerror = () => {
        // Browser auto-reconnects; enable polling as a fallback while disconnected
        startPolling();
      };
    };

    // Initial connect (may no-op if token not ready yet)
    connect();
    // Subscribe to auth store changes to reconnect when token/base changes
    const unsub = authStore.subscribe((state) => {
      const base = String(state.apiBaseUrl || defaultApiBaseUrl || "").replace(/\/+$/, "");
      const nextKey = state.jwtToken
        ? `${base}/notifications/events?api_key=${encodeURIComponent(state.jwtToken)}`
        : state.token
        ? `${base}/notifications/events?api_key=${encodeURIComponent(state.token)}`
        : "";
      if (nextKey && nextKey !== lastKey) {
        connect();
      }
      if (!nextKey) {
        // Close SSE if open and manage polling via JWT
        if (es) {
          try { es.close(); } catch {}
          es = null;
          lastKey = "";
        }
        if (state.jwtToken) startPolling();
        else stopPolling();
      }
    });

    return () => {
      try { if (es) es.close(); } catch {}
      try { unsub(); } catch {}
      stopPolling();
    };
  }, [qc]);
  return null;
}

function SessionManager() {
  useEffect(() => {
    let expTimer: number | null = null;
    let idleTimer: number | null = null;
    let lastActivity = Date.now();
    const IDLE_LOGOUT_MINUTES = 60; // auto-logout after inactivity

    function urlB64ToUtf8(b64: string): string {
      try {
        const pad = '='.repeat((4 - (b64.length % 4)) % 4);
        const base64 = (b64 + pad).replace(/-/g, '+').replace(/_/g, '/');
        const decoded = atob(base64);
        try {
          return decodeURIComponent(
            decoded
              .split('')
              .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
              .join(''),
          );
        } catch {
          return decoded;
        }
      } catch {
        return '';
      }
    }

    function getJwtExpMs(token: string | null | undefined): number | null {
      if (!token) return null;
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      try {
        const payloadJson = urlB64ToUtf8(parts[1]);
        const payload = JSON.parse(payloadJson);
        const expSec = Number(payload?.exp);
        if (!expSec || Number.isNaN(expSec)) return null;
        return expSec * 1000;
      } catch {
        return null;
      }
    }

    function doLogout() {
      authStore.setState({ jwtToken: null, username: null, name: null });
      try {
        if (typeof window !== 'undefined') {
          const current = String(window.location?.pathname || '');
          if (current !== '/auth') window.location.assign('/auth');
        }
      } catch {}
    }

    function scheduleIdleTimer() {
      if (idleTimer) {
        try { window.clearTimeout(idleTimer); } catch {}
        idleTimer = null;
      }
      const ms = IDLE_LOGOUT_MINUTES * 60 * 1000;
      idleTimer = window.setTimeout(() => {
        const now = Date.now();
        if (now - lastActivity >= ms) doLogout();
        else scheduleIdleTimer();
      }, ms);
    }

    function onActivity() {
      lastActivity = Date.now();
      scheduleIdleTimer();
    }

    function reschedule() {
      const { jwtToken } = authStore.getState();
      // schedule logout at JWT expiry
      const expMs = getJwtExpMs(jwtToken);
      if (expTimer) {
        try { window.clearTimeout(expTimer); } catch {}
        expTimer = null;
      }
      if (expMs) {
        const delay = Math.max(0, expMs - Date.now());
        expTimer = window.setTimeout(() => doLogout(), delay);
      }
      scheduleIdleTimer();
    }

    // Initial schedule and subscribe to auth changes
    reschedule();
    const unsub = authStore.subscribe(() => reschedule());

    // Activity listeners
    const winEvents: (keyof WindowEventMap)[] = ['mousemove', 'keydown', 'scroll', 'click'];
    const docEvents: (keyof DocumentEventMap)[] = ['visibilitychange'];
    winEvents.forEach((ev) => window.addEventListener(ev, onActivity, { passive: true }));
    docEvents.forEach((ev) => document.addEventListener(ev, onActivity as any, { passive: true }));

    return () => {
      try { unsub(); } catch {}
      if (expTimer) try { window.clearTimeout(expTimer); } catch {}
      if (idleTimer) try { window.clearTimeout(idleTimer); } catch {}
      winEvents.forEach((ev) => window.removeEventListener(ev, onActivity as any));
      docEvents.forEach((ev) => document.removeEventListener(ev, onActivity as any));
    };
  }, []);
  return null;
}

