import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";

type NotifConfig = Record<string, { enabled: boolean; [k: string]: any }>;

export default function NotificationsPage() {
  const [config, setConfig] = useState<NotifConfig>({});
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    // Placeholder: if backend exposes config later
  }, []);

  async function sendTest() {
    try {
      setSending(true);
      await apiClient.post("/notifications/test");
      alert("Тестовое уведомление отправлено");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">Уведомления</h1>
            <p className="text-sm text-textMuted">Настройки и тест отправки админ‑уведомлений</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="button-primary" onClick={sendTest} disabled={sending}>{sending ? "Отправка..." : "Отправить тест"}</button>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-outline/40 bg-surfaceMuted/40 p-4">
          <p className="text-xs text-textMuted">Адресаты берутся из настроек бота: ADMIN_NOTIFICATIONS_CHAT_ID / TOPIC_ID. Проверьте права бота на отправку в чат.</p>
        </div>
      </section>
    </div>
  );
}


