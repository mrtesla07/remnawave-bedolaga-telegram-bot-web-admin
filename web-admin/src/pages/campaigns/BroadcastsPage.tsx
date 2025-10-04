import { useEffect, useMemo, useState } from "react";
import { createBroadcast, fetchBroadcasts, stopBroadcast, uploadBroadcastMedia, type BroadcastListResponse, type BroadcastItem } from "@/features/broadcasts/api";

// Types now imported from features/broadcasts/api

const TARGETS = [
  { value: "all", label: "Все пользователи" },
  { value: "active", label: "Активные подписки" },
  { value: "trial", label: "Пробный период" },
  { value: "no", label: "Без подписки" },
  { value: "expiring", label: "Скоро истекает" },
  { value: "expired", label: "Истекшие" },
  { value: "active_zero", label: "Активные, баланс = 0" },
  { value: "trial_zero", label: "Триал, баланс = 0" },
  { value: "zero", label: "Баланс = 0" },
  { value: "custom_today", label: "Активность сегодня" },
  { value: "custom_week", label: "Неактивны неделю" },
  { value: "custom_month", label: "Неактивны месяц" },
  { value: "custom_active_today", label: "Были активны сегодня" },
  { value: "custom_inactive_week", label: "Неактивны неделю" },
  { value: "custom_inactive_month", label: "Неактивны месяц" },
  { value: "custom_referrals", label: "Рефералы" },
  { value: "custom_direct", label: "Прямые" },
];

const BUTTONS = [
  { value: "balance", label: "💰 Пополнить баланс" },
  { value: "referrals", label: "🤝 Партнерка" },
  { value: "promocode", label: "🎫 Промокод" },
  { value: "connect", label: "🔗 Подключиться" },
  { value: "subscription", label: "📱 Подписка" },
  { value: "support", label: "🛠️ Техподдержка" },
  { value: "home", label: "🏠 На главную" },
];

export default function BroadcastsPage() {
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(false);
  const [items, setItems] = useState<BroadcastItem[]>([]);
  const [message, setMessage] = useState("");
  const [target, setTarget] = useState("all");
  const [selectedButtons, setSelectedButtons] = useState<string[]>(["home"]);
  const [mediaType, setMediaType] = useState<"photo" | "video" | "document" | "">("");
  const [mediaFileId, setMediaFileId] = useState("");
  const [mediaCaption, setMediaCaption] = useState("");
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    const hasText = message.trim().length > 0;
    const hasCaption = (mediaCaption || "").trim().length > 0 && !!mediaType && !!mediaFileId;
    return (hasText || hasCaption) && !loading;
  }, [message, loading, mediaCaption, mediaType, mediaFileId]);

  async function loadList() {
    try {
      setListLoading(true);
      const data = await fetchBroadcasts({ limit: 50, offset: 0 });
      setItems(data.items);
    } catch (e: any) {
      // ignore
    } finally {
      setListLoading(false);
    }
  }

  useEffect(() => {
    loadList();
  }, []);

  async function handleCreate() {
    if (!canSubmit) return;
    try {
      setLoading(true);
      setError(null);
      const payload: any = {
        target,
        message_text: message,
        selected_buttons: selectedButtons,
      };
      if (mediaType && mediaFileId) {
        const caption = (mediaCaption || message || "").trim();
        payload.media = { type: mediaType as any, file_id: mediaFileId, caption: caption || undefined };
      }
      await createBroadcast(payload);
      setMessage("");
      setMediaType("");
      setMediaFileId("");
      setMediaCaption("");
      setMediaPreview(null);
      await loadList();
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      let msg = "Не удалось создать рассылку";
      if (typeof detail === "string") msg = detail;
      else if (Array.isArray(detail)) msg = detail.map((d: any) => d?.msg || "Ошибка ввода").join("; ");
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleStop(id: number) {
    try {
      await stopBroadcast(id);
      await loadList();
    } catch {}
  }

  return (
    <div className="space-y-8">
      <section className="card p-6">
        <h1 className="text-xl font-semibold">Рассылки</h1>
        <p className="text-sm text-textMuted">Создание и управление рассылками бота</p>

        <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
          <div className="space-y-4">
            <label className="block">
              <span className="mb-1 block text-xs uppercase tracking-[0.28em] text-textMuted">Целевая аудитория</span>
              <select className="w-full rounded-2xl border border-outline/40 bg-background/80 px-4 py-3 text-sm" value={target} onChange={(e) => setTarget(e.target.value)}>
                {TARGETS.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1 block text-xs uppercase tracking-[0.28em] text-textMuted">Текст сообщения</span>
              <textarea
                className="w-full rounded-2xl border border-outline/40 bg-background/80 px-4 py-3 text-sm min-h-[120px]"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Напишите текст рассылки..."
              />
            </label>

            <fieldset className="space-y-2">
              <legend className="mb-1 block text-xs uppercase tracking-[0.28em] text-textMuted">Кнопки под сообщением</legend>
              <div className="grid grid-cols-2 gap-2">
                {BUTTONS.map((b) => {
                  const checked = selectedButtons.includes(b.value);
                  return (
                    <label key={b.value} className="flex items-center gap-2 rounded-xl border border-outline/40 bg-background/60 px-3 py-2 text-sm">
                      <input
                        type="checkbox"
                        className="accent-primary"
                        checked={checked}
                        onChange={(e) => {
                          setSelectedButtons((prev) => {
                            if (e.target.checked) return Array.from(new Set([...prev, b.value]));
                            return prev.filter((v) => v !== b.value);
                          });
                        }}
                      />
                      <span>{b.label}</span>
                    </label>
                  );
                })}
              </div>
            </fieldset>

            <div className="grid grid-cols-3 gap-3">
              <label className="col-span-1 block">
                <span className="mb-1 block text-xs uppercase tracking-[0.28em] text-textMuted">Тип медиа</span>
                <select className="w-full rounded-2xl border border-outline/40 bg-background/80 px-3 py-2 text-sm" value={mediaType} onChange={(e) => setMediaType(e.target.value as any)}>
                  <option value="">Без медиа</option>
                  <option value="photo">Фото</option>
                  <option value="video">Видео</option>
                  <option value="document">Документ</option>
                </select>
              </label>
              <label className="col-span-2 block">
                <span className="mb-1 block text-xs uppercase tracking-[0.28em] text-textMuted">Медиа</span>
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    accept={mediaType === "photo" ? "image/*" : mediaType === "video" ? "video/*" : mediaType === "document" ? undefined : undefined}
                    className="flex-1 rounded-2xl border border-outline/40 bg-background/80 px-3 py-2 text-sm file:mr-3 file:rounded-xl file:border-0 file:bg-surface/60 file:px-3 file:py-1 file:text-xs"
                    onChange={async (e) => {
                      const file = e.target.files && e.target.files[0];
                      if (!file || !mediaType) return;
                      try {
                        setUploading(true);
                        setError(null);
                        const res = await uploadBroadcastMedia(file, mediaType as any, mediaCaption || message);
                        setMediaFileId(res.file_id);
                        setMediaPreview(res.preview_url || null);
                      } catch (err: any) {
                        const detail = err?.response?.data?.detail;
                        let msg = "Не удалось загрузить медиа";
                        if (typeof detail === "string") msg = detail;
                        setError(msg);
                      } finally {
                        setUploading(false);
                      }
                    }}
                    disabled={!mediaType || uploading}
                  />
                  <button
                    type="button"
                    className="button-ghost"
                    onClick={() => { setMediaFileId(""); setMediaPreview(null); }}
                    disabled={!mediaFileId}
                  >Очистить</button>
                </div>
                {mediaFileId ? <p className="mt-1 truncate text-xs text-textMuted">file_id: <span className="text-[11px] text-slate-300">{mediaFileId}</span></p> : null}
              </label>
              <label className="col-span-3 block">
                <span className="mb-1 block text-xs uppercase tracking-[0.28em] text-textMuted">Подпись к медиа</span>
                <input className="w-full rounded-2xl border border-outline/40 bg-background/80 px-3 py-2 text-sm" placeholder="Если оставить пустым — возьмётся текст сообщения" value={mediaCaption} onChange={(e) => setMediaCaption(e.target.value)} />
              </label>
            </div>

            {mediaPreview ? (
              <div className="rounded-2xl border border-outline/40 bg-surface/60 p-3">
                <p className="text-xs text-textMuted">Предпросмотр</p>
                <div className="mt-2">
                  {mediaType === "photo" ? (
                    <img src={mediaPreview} alt="preview" className="max-h-64 w-auto rounded-xl border border-outline/40 object-contain" />
                  ) : (
                    <a href={mediaPreview} target="_blank" rel="noopener noreferrer" className="button-ghost">Открыть медиа</a>
                  )}
                </div>
              </div>
            ) : null}

            {error ? <p className="text-xs text-danger">{error}</p> : null}
            <div className="flex items-center gap-3">
              <button className="button-primary" disabled={!canSubmit || uploading} onClick={handleCreate}>
                {loading ? "Отправка..." : "Запустить рассылку"}
              </button>
              {uploading ? <span className="text-xs text-textMuted">Загрузка медиа…</span> : null}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">История рассылок</h2>
              <button className="button-ghost" onClick={loadList} disabled={listLoading}>{listLoading ? "Обновление..." : "Обновить"}</button>
            </div>
            <div className="rounded-2xl border border-outline/40">
              <table className="w-full text-sm">
                <thead className="bg-surfaceMuted/60 text-textMuted">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Дата</th>
                    <th className="px-3 py-2 text-left font-medium">Цель</th>
                    <th className="px-3 py-2 text-left font-medium">Статус</th>
                    <th className="px-3 py-2 text-left font-medium">Отправлено</th>
                    <th className="px-3 py-2 text-left font-medium">Ошибок</th>
                    <th className="px-3 py-2 text-right font-medium">Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it) => (
                    <tr key={it.id} className="odd:bg-surface/40">
                      <td className="px-3 py-2 text-xs text-textMuted/90">{new Date(it.created_at).toLocaleString()}</td>
                      <td className="px-3 py-2 text-xs">{it.target_type}</td>
                      <td className="px-3 py-2 text-xs capitalize">{it.status}</td>
                      <td className="px-3 py-2 text-xs">{it.sent_count}/{Math.max(it.total_count, it.sent_count)}</td>
                      <td className="px-3 py-2 text-xs">{it.failed_count}</td>
                      <td className="px-3 py-2 text-right">
                        {(it.status === "queued" || it.status === "in_progress") ? (
                          <button className="button-ghost" onClick={() => handleStop(it.id)}>Остановить</button>
                        ) : (
                          <span className="text-textMuted text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      <section className="card p-6">
        <h2 className="text-sm font-semibold">Подсказки</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-textMuted">
          <li>Используйте File ID из Telegram для фото, видео и документов</li>
          <li>Кнопки под сообщением формируются из набора бота и выполняют действия в интерфейсе</li>
          <li>Целевые сегменты поддерживают как стандартные группы, так и custom_*</li>
          <li>История показывает прогресс и ошибки; активные рассылки можно остановить</li>
        </ul>
      </section>
    </div>
  );
}
