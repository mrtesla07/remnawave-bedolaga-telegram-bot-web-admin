import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "@/lib/api-client";
import { useAuthStore } from "@/store/auth-store";
import { AuthBackground } from "@/components/shared/AuthBackground";
import { TokenDialog } from "@/components/auth/TokenDialog";
import { ApiOfflineScreen } from "@/components/status/ApiOfflineScreen";
import { useConnectionStore } from "@/store/connection-store";

export function AuthPage() {
  const navigate = useNavigate();
  const jwtToken = useAuthStore((s) => s.jwtToken);
  const setJwtToken = useAuthStore((s) => s.setJwtToken);
  const setUsername = useAuthStore((s) => s.setUsername);
  const setToken = useAuthStore((s) => s.setToken);
  const isOnline = useConnectionStore((s) => s.isOnline);

  const [mode, setMode] = useState<"login" | "register">("register");
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isApiDialogOpen, setApiDialogOpen] = useState(false);
  const [isSubmitting, setSubmitting] = useState(false);
  const [canRegister, setCanRegister] = useState<boolean | null>(null);

  useEffect(() => {
    if (jwtToken) navigate("/", { replace: true });
  }, [jwtToken, navigate]);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await apiClient.get<{ can_register: boolean }>("/auth/can-register");
        setCanRegister(!!(data as any).can_register);
        if ((data as any).can_register) {
          setMode("register");
        } else {
          setMode("login");
        }
      } catch (e) {
        // Если API недоступен, оставляем регистрацию по умолчанию
        setCanRegister(null);
      }
    })();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!login || !password) {
      setError("Введите логин и пароль");
      return;
    }
    try {
      setSubmitting(true);
      if (mode === "register") {
        await apiClient.post("/auth/register", { username: login, password });
      }
      const { data } = await apiClient.post<{ access_token: string }>("/auth/login", { username: login, password });
      setJwtToken(data.access_token);
      setUsername(login.trim().toLowerCase());
      setToken(null);
      navigate("/", { replace: true });
    } catch (err: any) {
      if (!err?.response) {
        setError("Нет соединения с API. Проверьте адрес API и запуск сервера.");
      } else {
        if (err.response?.status === 403 && mode === "register") {
          setError("Регистрация отключена: администратор уже существует.");
        } else {
          const detail = err.response?.data?.detail;
          let message = "Ошибка авторизации";
          if (typeof detail === "string") {
            message = detail;
          } else if (Array.isArray(detail)) {
            message = detail.map((d: any) => d?.msg || "Ошибка ввода").join("; ");
          } else if (detail && typeof detail === "object") {
            message = detail.msg || message;
          }
          setError(message);
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOnline) {
    return <ApiOfflineScreen />;
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background text-slate-100 overflow-hidden">
      <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle_at_top,_rgba(110,89,245,0.35),transparent_55%)]" />
      <AuthBackground />
      <div className="relative z-10 w-full max-w-md rounded-3xl border border-outline/40 bg-surface/90 p-8 shadow-card">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold">{mode === "login" ? "Вход" : "Регистрация"}</h1>
          <p className="text-sm text-textMuted">Добро пожаловать! {mode === "login" ? "Войдите в аккаунт" : "Создайте аккаунт"}.</p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="mb-1 block text-xs uppercase tracking-[0.28em] text-textMuted">Логин</span>
            <input
              className="w-full rounded-2xl border border-outline/40 bg-background/80 px-4 py-3 text-sm focus:border-primary/70 focus:outline-none focus:ring-2 focus:ring-primary/40"
              value={login}
              onChange={(e) => { setLogin(e.target.value); if (error) setError(null); }}
              placeholder="username"
              autoComplete="username"
              autoFocus
              inputMode="text"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs uppercase tracking-[0.28em] text-textMuted">Пароль</span>
            <input
              type="password"
              className="w-full rounded-2xl border border-outline/40 bg-background/80 px-4 py-3 text-sm focus:border-primary/70 focus:outline-none focus:ring-2 focus:ring-primary/40"
              value={password}
              onChange={(e) => { setPassword(e.target.value); if (error) setError(null); }}
              placeholder="••••••••"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
            />
          </label>
          {error ? <p className="text-xs text-danger">{error}</p> : null}
          <button type="submit" className="button-primary w-full py-3" disabled={isSubmitting || !login || !password || (mode === "register" && canRegister === false)}>
            {mode === "login" ? "Войти" : "Зарегистрироваться"}
          </button>
        </form>

        <div className="mt-4 text-center text-sm text-textMuted">
          {canRegister === true ? null : canRegister === false ? null : null}
          <div className="mt-3">
            <button className="text-xs text-textMuted underline underline-offset-4" onClick={() => setApiDialogOpen(true)}>
              Настроить адрес API
            </button>
          </div>
        </div>
      </div>
      <TokenDialog open={isApiDialogOpen} onClose={() => setApiDialogOpen(false)} />
    </div>
  );
}


