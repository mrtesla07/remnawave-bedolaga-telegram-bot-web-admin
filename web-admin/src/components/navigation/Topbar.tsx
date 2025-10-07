import { Bell, CheckCircle2, ChevronDown, CircleUser, Filter, KeyRound, Loader2, LogOut, Moon, Search, Settings, ShieldCheck, Sun } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuthStore } from "@/store/auth-store";
import { apiClient } from "@/lib/api-client";
import { useLocation, useNavigate } from "react-router-dom";

interface TopbarProps {
  onOpenTokenDialog: () => void;
}

export function Topbar({ onOpenTokenDialog }: TopbarProps) {
  const userName = useAuthStore((s) => s.username) || "Admin";
  const setName = useAuthStore((s) => s.setName);
  const setUsername = useAuthStore((s) => s.setUsername);
  const navigate = useNavigate();
  const location = useLocation();
  const [dark, setDark] = useState(() => {
    try {
      const stored = window.localStorage.getItem("bedolaga-theme");
      if (stored === "dark") return true;
      if (stored === "light") return false;
      return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    } catch {
      return false;
    }
  });
  const [health, setHealth] = useState<{ ok: boolean; version?: string } | null>(null);
  const [loadingHealth, setLoadingHealth] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [search, setSearch] = useState(() => {
    const params = new URLSearchParams(location.search);
    return params.get("search") || "";
  });
  const bellRef = useRef<HTMLDivElement | null>(null);
  const profileRef = useRef<HTMLDivElement | null>(null);
  const dismissedIdsRef = useRef<Set<string>>(new Set());
  const [notifItems, setNotifItems] = useState<
    { id: string; time: string; level: string; logger: string; message: string; raw: string; read?: boolean }[]
  >([]);
  const [notifLoading, setNotifLoading] = useState(false);

  useEffect(() => {
    try {
      const raw = window.sessionStorage.getItem("bedolaga-notifs-dismissed");
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        dismissedIdsRef.current = new Set(parsed.filter((id) => typeof id === "string"));
      }
    } catch {}
  }, []);

  const persistDismissed = useCallback(() => {
    try {
      window.sessionStorage.setItem(
        "bedolaga-notifs-dismissed",
        JSON.stringify(Array.from(dismissedIdsRef.current)),
      );
    } catch {}
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoadingHealth(true);
        const { data } = await apiClient.get("/health");
        if (cancelled) return;
        setHealth({ ok: true, version: data?.version });
      } catch {
        if (cancelled) return;
        setHealth({ ok: false });
      } finally {
        if (cancelled) return;
        setLoadingHealth(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await apiClient.get("/auth/me");
        if (cancelled) return;
        setUsername((data as any)?.username || null);
        setName((data as any)?.name || null);
      } catch (err: any) {
        if (cancelled) return;
        const status = err?.response?.status;
        if (status === 401 || status === 403 || status === 404) {
          const store = useAuthStore.getState();
          store.setJwtToken(null);
          store.setUsername(null);
          store.setName(null);
          store.setToken(null);
          navigate('/auth', { replace: true });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [setName, setUsername, navigate]);

  const unreadNotifications = useMemo(() => notifItems.filter((item) => !item.read), [notifItems]);
  const unreadCount = unreadNotifications.length;

  const updateDarkClass = useCallback((value: boolean) => {
    const root = document.documentElement;
    if (value) root.classList.add("dark");
    else root.classList.remove("dark");
  }, []);

  // Initial state is derived synchronously from localStorage or system; no need to re-derive on mount

  useEffect(() => {
    try {
      updateDarkClass(dark);
      window.localStorage.setItem("bedolaga-theme", dark ? "dark" : "light");
    } catch {}
  }, [dark, updateDarkClass]);

  const loadNotifications = useCallback(
    async (markAllAsRead = false) => {
      setNotifLoading(true);
      try {
        const { data } = await apiClient.get("/logs", { params: { limit: 10, level: "WARNING" } });
        const items = (data?.items || []).map((item: any) => ({
          id: `${item.logger}-${item.time}-${item.message}`,
          ...item,
        }));
        const filtered = items.filter((item) => !dismissedIdsRef.current.has(item.id));
        setNotifItems((prev) => {
          const prevMap = new Map(prev.map((p) => [p.id, p]));
          return filtered.map((item) => {
            const prevItem = prevMap.get(item.id);
            const read = markAllAsRead ? true : prevItem?.read ?? false;
            return { ...item, read };
          });
        });
        if (markAllAsRead && filtered.length) {
          filtered.forEach((item) => dismissedIdsRef.current.add(item.id));
          persistDismissed();
        }
      } catch {
        setNotifItems([]);
      } finally {
        setNotifLoading(false);
      }
    },
    [persistDismissed],
  );

  const clearNotifications = useCallback(() => {
    if (notifItems.length === 0) return;
    notifItems.forEach((item) => dismissedIdsRef.current.add(item.id));
    persistDismissed();
    setNotifItems([]);
  }, [notifItems, persistDismissed]);

  useEffect(() => {
    loadNotifications(false);
    const intervalId = window.setInterval(() => {
      if (!notifOpen) loadNotifications(false);
    }, 45000);
    return () => window.clearInterval(intervalId);
  }, [loadNotifications, notifOpen]);

  useEffect(() => {
    if (notifOpen) {
      loadNotifications(true);
      setNotifItems((prev) => prev.map((item) => ({ ...item, read: true })));
    }
  }, [loadNotifications, notifOpen]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      const t = e.target as Node;
      if (bellRef.current && !bellRef.current.contains(t)) setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(t)) setProfileOpen(false);
    }
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  const navigateToUsers = useCallback(
    (query: string) => {
      const searchParams = new URLSearchParams(location.pathname === "/users" ? location.search : "");
      if (query) {
        searchParams.set("search", query);
      } else {
        searchParams.delete("search");
      }
      navigate({ pathname: "/users", search: searchParams.toString() });
      window.dispatchEvent(new CustomEvent("bedolaga-users-focus-search", { detail: query }));
    },
    [location.pathname, location.search, navigate],
  );

  useEffect(() => {
    setSearch(() => {
      const params = new URLSearchParams(location.search);
      return params.get("search") || "";
    });
  }, [location.search]);

  function onSearchKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      const query = search.trim();
      navigateToUsers(query);
    }
  }

  function doLogout() {
    try {
      useAuthStore.getState().clear();
    } finally {
      navigate("/auth");
    }
  }

  return (
    <header className="sticky top-0 z-40 flex h-20 items-center justify-between border-b border-outline/40 bg-background/80 px-8 backdrop-blur-lg">
      <div className="flex flex-1 items-center gap-4">
        <div className="relative hidden max-w-md flex-1 items-center lg:flex animate-bgFloat">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-textMuted" />
          <input
            className="w-full rounded-full border border-outline/50 bg-surfaceMuted/60 py-2.5 pl-11 pr-4 text-sm text-slate-100 placeholder:text-textMuted focus:border-primary/80 focus:outline-none focus:ring-2 focus:ring-primary/40"
            placeholder="Поиск по пользователям, ID, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={onSearchKey}
          />
        </div>
        <button
          className="hidden h-10 items-center gap-2 rounded-full border border-outline/40 bg-surfaceMuted/60 px-4 text-sm font-medium text-textMuted transition hover:border-outline hover:text-slate-100 lg:inline-flex"
          onClick={() => {
            if (location.pathname !== "/users") {
              navigate({ pathname: "/users", search: "" });
            }
            window.dispatchEvent(new CustomEvent("bedolaga-users-open-filters"));

            setTimeout(() => {
              window.dispatchEvent(new CustomEvent("bedolaga-users-focus-search", { detail: search.trim() }));
            }, 100);
          }}
          type="button"
        >
          <Filter className="h-4 w-4" />
          Фильтры
        </button>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-primary animate-pulseSoft">
          {loadingHealth ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : health?.ok ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <ShieldCheck className="h-4 w-4" />
          )}
          {health?.ok ? `бот активен${health?.version ? ` · ${health.version}` : ''}` : "проверка..."}
        </div>
        <div className="relative" ref={bellRef}>
          <button className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-outline/40 bg-surfaceMuted/60 text-textMuted transition hover:border-outline hover:text-slate-100" onClick={() => setNotifOpen((v) => !v)}>
            <Bell className="h-4 w-4" />
            {unreadCount > 0 ? (
              <span className="absolute -right-0.5 -top-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-danger text-[10px] font-semibold text-white">{Math.min(9, unreadCount)}</span>
            ) : null}
            <span className="sr-only">Уведомления</span>
          </button>
          {notifOpen ? (
            <div className="absolute right-0 top-12 w-[360px] overflow-hidden rounded-2xl border border-outline/40 bg-background/95 shadow-xl backdrop-blur-md animate-logIn">
              <div className="flex items-center justify-between gap-2 border-b border-outline/40 px-4 py-2 text-xs text-textMuted">
                <span>Последние события</span>
                <div className="flex items-center gap-2">
                  {notifItems.length > 0 ? (
                    <button
                      className="button-ghost text-xs"
                      onClick={() => {
                        loadNotifications(true);
                      }}
                    >
                      Обновить
                    </button>
                  ) : null}
                  <button
                    className="button-ghost text-xs"
                    onClick={() => {
                      clearNotifications();
                      setNotifOpen(false);
                    }}
                  >
                    Очистить
                  </button>
                  <button className="button-ghost text-xs" onClick={() => setNotifOpen(false)}>Закрыть</button>
                </div>
              </div>
              <ul className="max-h-[50vh] divide-y divide-outline/40 overflow-auto">
                {notifItems.length === 0 ? (
                  <li className="px-4 py-3 text-xs text-textMuted">
                    {notifLoading ? "Загрузка событий…" : "Нет новых событий"}
                  </li>
                ) : (
                  notifItems.map((n) => (
                    <li key={n.id} className="px-4 py-3 transition hover:bg-surfaceMuted/40">
                      <button
                        type="button"
                        className="flex w-full flex-col items-start gap-1 text-left"
                        onClick={() => {
                          dismissedIdsRef.current.add(n.id);
                          persistDismissed();
                          setNotifItems((prev) => prev.filter((item) => item.id !== n.id));
                        }}
                      >
                        <p className="text-xs text-textMuted">{new Date(n.time).toLocaleString()} • {n.level}</p>
                        <p className="text-sm text-slate-200">{n.message || n.raw}</p>
                        <span className="text-xs text-primary/70">Отметить как прочитано</span>
                      </button>
                    </li>
                  ))
                )}
              </ul>
            </div>
          ) : null}
        </div>
        <button
          className="relative hidden h-10 w-10 items-center justify-center rounded-xl border border-outline/40 bg-surfaceMuted/60 text-textMuted transition hover:border-outline hover:text-slate-100 lg:flex"
          onClick={onOpenTokenDialog}
          type="button"
        >
          <KeyRound className="h-4 w-4" />
          <span className="sr-only">Настроить API токен</span>
        </button>
        <div className="relative" ref={profileRef}>
          <button className="flex items-center gap-3 rounded-full border border-outline/40 bg-surfaceMuted/60 px-3 py-2 text-sm font-medium text-slate-100 transition hover:border-outline" onClick={() => setProfileOpen((v) => !v)}>
            <CircleUser className="h-7 w-7 text-primary animate-blob" />
            <div className="hidden text-left md:block">
              <p className="text-sm font-semibold leading-4">{userName}</p>
              <p className="text-xs text-textMuted">Администратор</p>
            </div>
            <ChevronDown className="h-4 w-4 text-textMuted" />
          </button>
          {profileOpen ? (
            <div className="absolute right-0 top-12 w-56 overflow-hidden rounded-2xl border border-outline/40 bg-background/95 shadow-xl backdrop-blur-md animate-logIn">
              <button className="flex w-full items-center gap-2 px-4 py-2 text-sm text-slate-200 hover:bg-surface/60" onClick={() => { setProfileOpen(false); navigate('/profile'); }}>
                <CircleUser className="h-4 w-4" /> Профиль
              </button>
              <button className="flex w-full items-center gap-2 px-4 py-2 text-sm text-slate-200 hover:bg-surface/60" onClick={() => { setProfileOpen(false); navigate('/settings'); }}>
                <Settings className="h-4 w-4" /> Настройки
              </button>
              <div className="my-1 border-t border-outline/40" />
              <button className="flex w-full items-center gap-2 px-4 py-2 text-sm text-danger hover:bg-surface/60" onClick={doLogout}>
                <LogOut className="h-4 w-4" /> Выйти
              </button>
            </div>
          ) : null}
        </div>
        <button className="hidden h-10 items-center gap-2 rounded-full border border-outline/40 bg-surfaceMuted/60 px-4 text-sm font-medium text-textMuted transition hover:border-outline hover:text-slate-100 lg:inline-flex" onClick={() => setDark((d) => !d)}>
          {dark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          {dark ? "Dark" : "Light"}
        </button>
      </div>
    </header>
  );
}
