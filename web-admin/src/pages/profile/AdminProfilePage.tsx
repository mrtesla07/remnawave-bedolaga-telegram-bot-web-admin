import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { useAuthStore } from "@/store/auth-store";

interface AdminProfile {
  id: number;
  username: string;
  email?: string | null;
  name?: string | null;
  created_at: string;
  updated_at: string;
}

export function AdminProfilePage() {
  const jwtToken = useAuthStore((s) => s.jwtToken);
  const [data, setData] = useState<AdminProfile | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!jwtToken) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    apiClient
      .get<AdminProfile>("/auth/me", { headers: { Authorization: `Bearer ${jwtToken}` } })
      .then((res) => {
        if (cancelled) return;
        setData(res.data);
        setName(res.data.name || "");
        setEmail(res.data.email || "");
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err?.response?.data?.detail || "Ошибка загрузки");
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [jwtToken]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await apiClient.put<AdminProfile>(
        "/auth/me",
        { name, email, password: password || undefined },
        { headers: { Authorization: `Bearer ${jwtToken}` } },
      );
      setData(res.data);
      setPassword("");
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  };

  if (!data) {
    return (
      <div className="space-y-3">
        {error ? (
          <div className="rounded-3xl border border-danger/30 bg-danger/10 p-8 text-center text-danger">{error}</div>
        ) : (
          <div className="rounded-3xl border border-outline/40 bg-surface/60 p-8 text-center text-textMuted">{loading ? "Загрузка профиля…" : "Нет данных профиля"}</div>
        )}
      </div>
    );
  }

  return (
    <section className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.32em] text-textMuted/70">Настройки</p>
          <h1 className="text-xl font-semibold text-white">Профиль администратора</h1>
        </div>
      </header>

      {error ? <div className="rounded-2xl border border-danger/30 bg-danger/10 p-3 text-sm text-danger">{error}</div> : null}

      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-2">
          <span className="text-xs uppercase tracking-[0.28em] text-textMuted">Username</span>
          <input className="rounded-2xl border border-outline/40 bg-surface/60 px-3 py-2 text-sm text-slate-100" value={data.username} disabled />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-xs uppercase tracking-[0.28em] text-textMuted">Имя</span>
          <input className="rounded-2xl border border-outline/40 bg-surface/60 px-3 py-2 text-sm text-slate-100" value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-xs uppercase tracking-[0.28em] text-textMuted">Email</span>
          <input className="rounded-2xl border border-outline/40 bg-surface/60 px-3 py-2 text-sm text-slate-100" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-xs uppercase tracking-[0.28em] text-textMuted">Новый пароль</span>
          <input type="password" className="rounded-2xl border border-outline/40 bg-surface/60 px-3 py-2 text-sm text-slate-100" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Оставьте пустым, чтобы не менять" />
        </label>
      </div>

      <div className="flex items-center justify-end">
        <button className="button-primary" onClick={handleSave} disabled={saving}>{saving ? "Сохранение…" : "Сохранить"}</button>
      </div>
    </section>
  );
}


