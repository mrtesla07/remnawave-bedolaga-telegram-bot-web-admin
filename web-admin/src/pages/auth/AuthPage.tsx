import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/auth-store";

export function AuthPage() {
  const navigate = useNavigate();
  const token = useAuthStore((s) => s.token);
  const setToken = useAuthStore((s) => s.setToken);

  const [mode, setMode] = useState<"login" | "register">("login");
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (token) navigate("/", { replace: true });
  }, [token, navigate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Временно используем токен как пароль, пока бекенд не выдаёт JWT
    if (!login || !password) {
      setError("Введите логин и пароль");
      return;
    }
    // Заглушка: выставим токен на основе ввода
    setToken(`${login}:${password}`);
    navigate("/", { replace: true });
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background text-slate-100">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(110,89,245,0.35),transparent_55%)]" />
      <div className="w-full max-w-md rounded-3xl border border-outline/40 bg-surface/90 p-8 shadow-card">
        <div className="mb-6 text-center">
          <img src={encodeURI("/Новая%20папка/logo2.svg")} alt="Logo" className="mx-auto mb-3 h-14 w-14 animate-pulse" />
          <h1 className="text-2xl font-semibold">{mode === "login" ? "Вход" : "Регистрация"}</h1>
          <p className="text-sm text-textMuted">Добро пожаловать! {mode === "login" ? "Войдите в аккаунт" : "Создайте аккаунт"}.</p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="mb-1 block text-xs uppercase tracking-[0.28em] text-textMuted">Логин</span>
            <input className="w-full rounded-2xl border border-outline/40 bg-background/80 px-4 py-3 text-sm focus:border-primary/70 focus:outline-none focus:ring-2 focus:ring-primary/40" value={login} onChange={(e) => setLogin(e.target.value)} placeholder="username" />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs uppercase tracking-[0.28em] text-textMuted">Пароль</span>
            <input type="password" className="w-full rounded-2xl border border-outline/40 bg-background/80 px-4 py-3 text-sm focus:border-primary/70 focus:outline-none focus:ring-2 focus:ring-primary/40" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
          </label>
          {error ? <p className="text-xs text-danger">{error}</p> : null}
          <button type="submit" className="button-primary w-full py-3">{mode === "login" ? "Войти" : "Зарегистрироваться"}</button>
        </form>

        <div className="mt-4 text-center text-sm text-textMuted">
          {mode === "login" ? (
            <button className="text-primary" onClick={() => setMode("register")}>Нет аккаунта? Регистрация</button>
          ) : (
            <button className="text-primary" onClick={() => setMode("login")}>Уже зарегистрированы? Войти</button>
          )}
        </div>
      </div>
    </div>
  );
}


