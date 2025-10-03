export default function FaqApiPage() {
  const rows = [
    ["GET", "/health", "Статус API, версия бота, флаги включённых сервисов"],
    ["GET", "/stats/overview", "Сводная статистика по пользователям, подпискам, платежам и тикетам"],
    ["GET", "/settings/categories", "Категории системных настроек"],
    ["GET", "/settings", "Полный список настроек"],
    ["GET", "/settings/{key}", "Получить одну настройку"],
    ["PUT", "/settings/{key}", "Обновить значение настройки"],
    ["DELETE", "/settings/{key}", "Сбросить настройку к значению по умолчанию"],
    ["GET", "/users", "Список пользователей"],
    ["GET", "/users/{id}", "Детали пользователя"],
    ["POST", "/users", "Создать пользователя"],
    ["PATCH", "/users/{id}", "Обновить профиль пользователя или статус"],
    ["POST", "/users/{id}/balance", "Корректировка баланса"],
    ["GET", "/subscriptions", "Список подписок"],
    ["POST", "/subscriptions", "Создать триальную или платную подписку"],
    ["POST", "/subscriptions/{id}/extend", "Продлить подписку на N дней"],
    ["POST", "/subscriptions/{id}/traffic", "Добавить трафик (ГБ)"],
    ["POST", "/subscriptions/{id}/devices", "Добавить устройства"],
    ["POST", "/subscriptions/{id}/squads", "Привязать сквад"],
    ["DELETE", "/subscriptions/{id}/squads/{uuid}", "Удалить сквад"],
    ["GET", "/transactions", "История транзакций"],
    ["GET", "/tickets", "Список тикетов поддержки"],
    ["GET", "/tickets/{id}", "Тикет с перепиской"],
    ["POST", "/tickets/{id}/status", "Изменить статус тикета"],
    ["POST", "/tickets/{id}/priority", "Изменить приоритет"],
    ["POST", "/tickets/{id}/reply-block", "Заблокировать ответы пользователя"],
    ["DELETE", "/tickets/{id}/reply-block", "Снять блокировку"],
    ["GET", "/promo-groups", "Список промо-групп"],
    ["POST", "/promo-groups", "Создать промо-группу"],
    ["PATCH", "/promo-groups/{id}", "Обновить промо-группу"],
    ["DELETE", "/promo-groups/{id}", "Удалить промо-группу"],
    ["GET", "/tokens", "Управление токенами доступа"],
  ];

  const remna = [
    ["GET", "/remnawave/status", "Проверка конфигурации и доступности RemnaWave API"],
    ["GET", "/remnawave/system", "Агрегированная статистика по пользователям, нодам и трафику"],
    ["GET", "/remnawave/nodes", "Список нод и их текущее состояние"],
    ["GET", "/remnawave/nodes/realtime", "Текущая загрузка нод (realtime-метрики)"],
    ["GET", "/remnawave/nodes/{uuid}", "Детальная информация по ноде"],
    ["GET", "/remnawave/nodes/{uuid}/statistics", "Статистика и история нагрузок по ноде"],
    ["GET", "/remnawave/nodes/{uuid}/usage", "История использования ноды пользователями"],
    ["POST", "/remnawave/nodes/{uuid}/actions", "Включить/отключить/перезапустить ноду"],
    ["POST", "/remnawave/nodes/restart", "Массовый перезапуск всех нод"],
    ["GET", "/remnawave/squads", "Список внутренних сквадов"],
    ["GET", "/remnawave/squads/{uuid}", "Детали выбранного сквада"],
    ["POST", "/remnawave/squads", "Создание нового сквада и привязка inbounds"],
    ["PATCH", "/remnawave/squads/{uuid}", "Обновление имени или состава inbounds"],
    ["POST", "/remnawave/squads/{uuid}/actions", "Массовые операции со сквадом"],
    ["GET", "/remnawave/inbounds", "Список доступных inbounds"],
    ["GET", "/remnawave/users/{telegram_id}/traffic", "Трафик пользователя"],
    ["POST", "/remnawave/sync/from-panel", "Синхронизация из панели в бота"],
    ["POST", "/remnawave/sync/to-panel", "Синхронизация из бота в панель"],
    ["POST", "/remnawave/sync/subscriptions/validate", "Проверка и восстановление подписок"],
    ["POST", "/remnawave/sync/subscriptions/cleanup", "Очистка осиротевших подписок"],
    ["POST", "/remnawave/sync/subscriptions/statuses", "Приведение статусов к единому виду"],
    ["GET", "/remnawave/sync/recommendations", "Рекомендации по синхронизации"],
  ];

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-xl font-semibold">FAQ по API</h1>
        <p className="text-sm text-textMuted">Основные эндпоинты административного API</p>
        <div className="mt-4 overflow-hidden rounded-2xl border border-outline/40">
          <table className="w-full text-sm">
            <thead className="bg-surfaceMuted/60 text-textMuted">
              <tr>
                <th className="px-4 py-2 text-left font-medium">Метод</th>
                <th className="px-4 py-2 text-left font-medium">Путь</th>
                <th className="px-4 py-2 text-left font-medium">Назначение</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(([m, p, d]) => (
                <tr key={`${m}-${p}`} className="odd:bg-surface/40">
                  <td className="px-4 py-2 font-mono text-xs text-textMuted/90">{m}</td>
                  <td className="px-4 py-2 font-mono text-xs">{p}</td>
                  <td className="px-4 py-2 text-slate-200">{d}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold">RemnaWave интеграция</h2>
        <p className="text-sm text-textMuted">Эндпоинты управления панелью RemnaWave</p>
        <div className="mt-4 overflow-hidden rounded-2xl border border-outline/40">
          <table className="w-full text-sm">
            <thead className="bg-surfaceMuted/60 text-textMuted">
              <tr>
                <th className="px-4 py-2 text-left font-medium">Метод</th>
                <th className="px-4 py-2 text-left font-medium">Путь</th>
                <th className="px-4 py-2 text-left font-medium">Назначение</th>
              </tr>
            </thead>
            <tbody>
              {remna.map(([m, p, d]) => (
                <tr key={`${m}-${p}`} className="odd:bg-surface/40">
                  <td className="px-4 py-2 font-mono text-xs text-textMuted/90">{m}</td>
                  <td className="px-4 py-2 font-mono text-xs">{p}</td>
                  <td className="px-4 py-2 text-slate-200">{d}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-textMuted">Если WEB_API_DOCS_ENABLED=true, документация доступна по /docs</p>
      </section>

      <section>
        <h3 className="text-base font-semibold">Сценарий интеграции веб-админки</h3>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-textMuted">
          <li>Перед входом UI вызывает GET /health</li>
          <li>Настройки: /settings/categories → /settings</li>
          <li>Дашборд: /stats/overview</li>
          <li>Пользователи: /users, карточка: /users/{'{'}id{'}'}</li>
          <li>Подписки: POST /subscriptions/{'{'}id{'}'}/...</li>
          <li>Поддержка: /tickets, управление статусами/блокировками</li>
          <li>Операции: /transactions</li>
        </ul>
      </section>
    </div>
  );
}


