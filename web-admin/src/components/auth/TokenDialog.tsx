import { FormEvent, useEffect, useState } from "react";
import { KeyRound, Link2 } from "lucide-react";
import { defaultApiBaseUrl } from "@/lib/config";
import { ApiTokenValidationError, validateApiToken } from "@/lib/api-token-validator";
import { useAuthStore } from "@/store/auth-store";

interface TokenDialogProps {
  open: boolean;
  onClose: () => void;
}

export function TokenDialog({ open, onClose }: TokenDialogProps) {
  const token = useAuthStore((state) => state.token);
  const jwtToken = useAuthStore((state) => state.jwtToken);
  const apiBaseUrl = useAuthStore((state) => state.apiBaseUrl);
  const setToken = useAuthStore((state) => state.setToken);
  const setApiBaseUrl = useAuthStore((state) => state.setApiBaseUrl);

  const [tokenValue, setTokenValue] = useState(token ?? "");
  const [baseUrlValue, setBaseUrlValue] = useState(apiBaseUrl ?? defaultApiBaseUrl);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setSubmitting] = useState(false);

  const allowToken = Boolean(jwtToken);

  useEffect(() => {
    if (open) {
      setTokenValue(token ?? "");
      setBaseUrlValue(apiBaseUrl ?? defaultApiBaseUrl);
      setError(null);
      setSubmitting(false);
    }
  }, [open, token, apiBaseUrl]);

  if (!open) {
    return null;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    const trimmedToken = tokenValue.trim();
    const trimmedUrl = baseUrlValue.trim().replace(/\/+$/, "");

    if (allowToken && !trimmedToken) {
      setError("Укажите действительный токен API");
      return;
    }

    let normalizedUrl = trimmedUrl.length > 0 ? trimmedUrl : defaultApiBaseUrl;
    if (!/^https?:\/\//i.test(normalizedUrl)) {
      normalizedUrl = `http://${normalizedUrl}`;
    }

    if (allowToken) {
      setSubmitting(true);
      try {
        await validateApiToken({ baseUrl: normalizedUrl, token: trimmedToken });
      } catch (error) {
        const message =
          error instanceof ApiTokenValidationError
            ? error.message
            : error instanceof Error && error.message
            ? error.message
            : "Не удалось проверить API ключ";
        setError(message);
        return;
      } finally {
        setSubmitting(false);
      }
      setToken(trimmedToken);
    }

    setApiBaseUrl(normalizedUrl);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-lg rounded-3xl border border-outline/40 bg-surface/90 p-8 shadow-card">
        <p className="text-xs uppercase tracking-[0.28em] text-textMuted/70">подключение api</p>
        <h2 className="mt-2 text-2xl font-semibold text-white">
          {allowToken ? "Укажите токен Bedolaga Web API" : "Укажите адрес API для подключения"}
        </h2>
        {allowToken ? (
          <p className="mt-2 text-sm text-textMuted">
            Создайте токен по инструкции в docs/web-admin-integration.md: запрос `POST /tokens` с заголовком `X-API-Key`.
            Для постоянной работы UI понадобится Bearer токен.
          </p>
        ) : (
          <p className="mt-2 text-sm text-textMuted">Укажите корректный адрес административного API, затем продолжите регистрацию/вход.</p>
        )}

        <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
          <label className="block text-sm text-textMuted">
            <span className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.28em]">API URL</span>
            <span className="relative flex items-center">
              <Link2 className="pointer-events-none absolute left-4 h-4 w-4 text-textMuted" />
              <input
                className="w-full rounded-2xl border border-outline/40 bg-background/80 py-3 pl-12 pr-4 text-sm text-slate-100 placeholder:text-textMuted focus:border-primary/70 focus:outline-none focus:ring-2 focus:ring-primary/40"
                value={baseUrlValue}
                onChange={(event) => setBaseUrlValue(event.target.value)}
                placeholder="http://127.0.0.1:8080"
              />
            </span>
          </label>

          {allowToken ? (
            <label className="block text-sm text-textMuted">
              <span className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.28em]">Bearer токен</span>
              <span className="relative flex items-center">
                <KeyRound className="pointer-events-none absolute left-4 h-4 w-4 text-textMuted" />
                <input
                  className="w-full rounded-2xl border border-outline/40 bg-background/80 py-3 pl-12 pr-4 text-sm text-slate-100 placeholder:text-textMuted focus:border-primary/70 focus:outline-none focus:ring-2 focus:ring-primary/40"
                  value={tokenValue}
                  onChange={(event) => setTokenValue(event.target.value)}
                  placeholder="paste-your-token"
                />
              </span>
            </label>
          ) : null}

          {error ? <p className="text-xs text-danger">{error}</p> : null}

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              className="text-sm text-textMuted transition hover:text-slate-100"
              onClick={() => {
                setTokenValue("");
                setToken(null);
                setError(null);
                onClose();
              }}
            >
              Отменить
            </button>
            <button type="submit" className="button-primary" disabled={isSubmitting}>
              Сохранить и подключиться
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}



