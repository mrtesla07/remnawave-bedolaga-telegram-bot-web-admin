import { useState, useEffect } from "react";
import { clsx } from "clsx";
import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "@/components/navigation/Sidebar";
import { Topbar } from "@/components/navigation/Topbar";
import { TokenDialog } from "@/components/auth/TokenDialog";
import { useAuthStore } from "@/store/auth-store";
import { LoggedInBackground } from "@/components/shared/LoggedInBackground";
import { useConnectionStore } from "@/store/connection-store";
import { ApiOfflineScreen } from "@/components/status/ApiOfflineScreen";
import { ApiTokenValidationError, validateApiToken } from "@/lib/api-token-validator";

export function MainLayout() {
  const location = useLocation();
  const token = useAuthStore((state) => state.token);
  const jwtToken = useAuthStore((state) => state.jwtToken);
  const hydrated = useAuthStore((state) => state.hydrated);
  const apiBaseUrl = useAuthStore((state) => state.apiBaseUrl);
  const isOnline = useConnectionStore((state) => state.isOnline);
  const [manualOpen, setManualOpen] = useState(false);
  const [dimBg, setDimBg] = useState(false);
  const dimCounterRef = (globalThis as any).__bedolaga_dim_counter || { value: 0 };
  (globalThis as any).__bedolaga_dim_counter = dimCounterRef;
  // Показываем диалог только после гидратации стора, чтобы избежать открытия и сразу закрытия
  const requireToken = Boolean(jwtToken) && !token;

  // Validate persisted API token after hydration; if invalid, clear it to force TokenDialog
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!hydrated) return;
      if (!jwtToken) return;
      if (!token) return;
      try {
        await validateApiToken({ baseUrl: apiBaseUrl, token });
        if (!cancelled) {
          try { useConnectionStore.getState().setOnline(true); } catch {}
        }
      } catch (error) {
        if (cancelled) return;
        if (error instanceof ApiTokenValidationError) {
          if (error.reason === "network" || error.reason === "timeout") {
            try { useConnectionStore.getState().setOnline(false); } catch {}
          }
        }
        try { useAuthStore.getState().setToken(null); } catch {}
      }
    })();
    return () => { cancelled = true; };
  }, [hydrated, jwtToken, token, apiBaseUrl]);

  // Listen for global dim background events
  useEffect(() => {
    function onDimToggle(e: Event) {
      try {
        const ce = e as CustomEvent;
        const enable = Boolean(ce.detail);
        dimCounterRef.value = enable ? Math.max(1, dimCounterRef.value) : 0;
        setDimBg(dimCounterRef.value > 0);
      } catch {}
    }
    function onDimOn() {
      dimCounterRef.value += 1;
      setDimBg(true);
    }
    function onDimOff() {
      dimCounterRef.value = Math.max(0, dimCounterRef.value - 1);
      setDimBg(dimCounterRef.value > 0);
    }
    window.addEventListener("bedolaga-dim-bg", onDimToggle as any);
    window.addEventListener("bedolaga-dim-bg-on", onDimOn as any);
    window.addEventListener("bedolaga-dim-bg-off", onDimOff as any);
    return () => {
      window.removeEventListener("bedolaga-dim-bg", onDimToggle as any);
      window.removeEventListener("bedolaga-dim-bg-on", onDimOn as any);
      window.removeEventListener("bedolaga-dim-bg-off", onDimOff as any);
    };
  }, []);


  if (requireToken) {
    return (
      <div className="relative flex min-h-screen bg-background text-text">
        <div className={clsx("transition-opacity duration-200", dimBg ? "opacity-0" : "opacity-100")}> 
          <LoggedInBackground />
        </div>
        <TokenDialog open={true} onClose={() => {}} />
      </div>
    );
  }

  if (!isOnline) {
    return <ApiOfflineScreen />;
  }

  return (
    <div className="relative flex min-h-screen bg-background text-text">
      <div className={clsx("transition-opacity duration-200", dimBg ? "opacity-0" : "opacity-100")}> 
        <LoggedInBackground />
      </div>
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <Topbar onOpenTokenDialog={() => setManualOpen(true)} />
        <main className="flex-1 overflow-y-auto px-8 pb-12 pt-6">
          <div className="window-frame mx-auto max-w-6xl rounded-3xl bg-background/90 backdrop-blur-md shadow-card p-6 sm:p-8">
            <Outlet />
          </div>
        </main>
      </div>
      <TokenDialog open={requireToken || manualOpen} onClose={() => setManualOpen(false)} />
    </div>
  );
}

