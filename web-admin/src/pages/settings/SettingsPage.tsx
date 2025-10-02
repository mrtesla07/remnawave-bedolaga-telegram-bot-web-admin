import { useMemo, useState } from "react";
import { useResetSetting, useSettingCategories, useSettings, useUpdateSetting } from "@/features/settings/queries";
import { Check, Layers3, Puzzle, RefreshCw, Search, Settings, Sliders, ToggleLeft, ToggleRight } from "lucide-react";

export function SettingsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);
  const [search, setSearch] = useState<string>("");
  const categories = useSettingCategories();
  const settings = useSettings(selectedCategory);
  const updateMut = useUpdateSetting();
  const resetMut = useResetSetting();

  const items = (settings.data || []).filter((d) => d.name.toLowerCase().includes(search.toLowerCase()) || d.key.toLowerCase().includes(search.toLowerCase()));
  const grouped = useMemo(() => {
    const map = new Map<string, typeof items>();
    for (const item of items) {
      const key = item.category.key;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    }
    return map;
  }, [items]);

  const sections = useMemo(() => buildCategorySections(categories.data || []), [categories.data]);
  const [activeGroup, setActiveGroup] = useState<string>(sections[0]?.key || "system");

  return (
    <section className="space-y-6">
      <header className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surfaceMuted/80 text-primary">
          <Settings className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.32em] text-textMuted/70">Конфигурация</p>
          <h1 className="text-xl font-semibold text-white">Настройки</h1>
        </div>
      </header>

      <div className="flex flex-col gap-4 sm:flex-row">
        <aside className="w-full sm:w-64">
          <div className="rounded-3xl border border-outline/40 bg-surfaceMuted/40 p-3">
            <div className="mb-3 grid grid-cols-3 gap-2">
              {sections.map((s) => (
                <button
                  key={s.key}
                  className={`rounded-xl px-2 py-2 text-center text-[11px] font-semibold uppercase tracking-wide ${activeGroup === s.key ? "bg-surface/60 text-white" : "text-textMuted hover:text-slate-100"}`}
                  onClick={() => {
                    setActiveGroup(s.key);
                    setSelectedCategory(undefined);
                  }}
                  title={s.label}
                >
                  <div className="flex items-center justify-center gap-2">
                    {s.icon}
                    <span className="hidden sm:inline">{s.label}</span>
                  </div>
                </button>
              ))}
            </div>
            <div className="mb-2 flex items-center gap-2 rounded-xl bg-background/60 px-3 py-2">
              <Search className="h-4 w-4 text-textMuted" />
              <input
                className="w-full bg-transparent text-sm text-slate-100 placeholder:text-textMuted focus:outline-none"
                placeholder="Поиск настроек"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button
              className={`w-full rounded-xl px-3 py-2 text-left text-sm ${!selectedCategory ? "bg-surface/50 text-white" : "text-textMuted hover:text-slate-100"}`}
              onClick={() => setSelectedCategory(undefined)}
            >
              Все категории
            </button>
            {sections.filter((sec) => sec.key === activeGroup).map((section) => (
              <div key={section.key} className="mt-2">
                <div className="flex items-center gap-2 px-2 py-1 text-[11px] uppercase tracking-[0.28em] text-textMuted">
                  {section.icon}
                  <span>{section.label}</span>
                </div>
                {section.categories.map((cat) => (
                  <button
                    key={cat.key}
                    className={`mt-1 w-full rounded-xl px-3 py-2 text-left text-sm ${selectedCategory === cat.key ? "bg-surface/50 text-white" : "text-textMuted hover:text-slate-100"}`}
                    onClick={() => setSelectedCategory(cat.key)}
                  >
                    <span className="inline-flex items-center gap-2">
                      <span>{cat.label}</span>
                      <span className="rounded-full bg-surface/60 px-2 py-0.5 text-[10px] text-textMuted">{cat.items}</span>
                    </span>
                  </button>
                ))}
              </div>
            ))}
          </div>
        </aside>

        <div className="flex-1 space-y-4">
          {[...grouped.entries()].map(([catKey, defs]) => (
            <section key={catKey} className="space-y-3">
              <h2 className="text-sm font-semibold text-white/80">
                {(categories.data || []).find((c) => c.key === catKey)?.label ?? catKey}
              </h2>
              <div className="grid gap-3 md:grid-cols-2">
                {defs.map((def) => {
                  const meta = getSettingMeta(def.key, def.name);
                  return (
                  <SettingRow
                    key={def.key}
                    defKey={def.key}
                    title={meta.title}
                    description={meta.description}
                    type={def.type}
                    value={def.current}
                    original={def.original}
                    hasOverride={def.has_override}
                    choices={def.choices}
                    onSave={(value) => updateMut.mutate({ key: def.key, value })}
                    onReset={() => resetMut.mutate(def.key)}
                  />
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </div>
    </section>
  );
}

function SettingRow(props: {
  defKey: string;
  title: string;
  description?: string;
  type: string;
  value: unknown;
  original: unknown;
  hasOverride: boolean;
  choices: Array<{ value: unknown; label: string; description?: string | null }>;
  onSave: (value: unknown) => void;
  onReset: () => void;
}) {
  const { defKey, title, description, type, value, hasOverride, choices, onSave, onReset } = props;
  const isBoolean = type.toLowerCase() === "bool" || type.toLowerCase() === "boolean";
  const isNumber = type.toLowerCase() === "int" || type.toLowerCase() === "float" || type.toLowerCase() === "number";
  const [draft, setDraft] = useState<string>(String(value ?? ""));
  const descText = description || guessDescription(type, choices, defKey);

  return (
    <div className="rounded-2xl border border-outline/40 bg-surfaceMuted/40 p-3 transition-colors hover:border-primary/30 hover:bg-surface/60">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-white">{title}</p>
          <p className="mt-0.5 text-xs text-textMuted">{descText}</p>
          {/* Тип и значение по умолчанию скрыты по требованию */}
        </div>
        <div className="flex items-center gap-2">
          {!isBoolean && (value === null || value === undefined || String(value).trim() === "") ? (
            <span className="rounded-full bg-danger/20 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-danger">требует настройки</span>
          ) : null}
          {hasOverride ? (
            <span className="rounded-full bg-warning/15 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-warning">override</span>
          ) : null}
        </div>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto_auto]">
        {isBoolean ? (
          <button
            className="inline-flex items-center gap-2 rounded-xl bg-background/70 px-3 py-2 text-sm text-slate-100"
            onClick={() => setDraft(draft === "true" ? "false" : "true")}
          >
            {draft === "true" ? <ToggleRight className="h-4 w-4 text-success" /> : <ToggleLeft className="h-4 w-4 text-textMuted" />}
            {draft === "true" ? "Включено" : "Выключено"}
          </button>
        ) : choices && choices.length > 0 ? (
          <select
            className="rounded-xl border border-outline/40 bg-background/70 px-3 py-2 text-sm text-slate-100"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          >
            {choices.map((opt) => (
              <option key={String(opt.value)} value={String(opt.value)}>
                {opt.label}
              </option>
            ))}
          </select>
        ) : (
          <input
            className="rounded-xl border border-outline/40 bg-background/70 px-3 py-2 text-sm text-slate-100"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Введите значение"
            inputMode={isNumber ? "numeric" : undefined}
          />
        )}

        <button
          className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold ${String(value ?? "") === draft ? "cursor-not-allowed bg-primary/10 text-primary/60" : "bg-primary/20 text-primary hover:bg-primary/30"}`}
          onClick={() => onSave(coerceDraft(draft, type))}
          disabled={String(value ?? "") === draft}
        >
          <Check className="h-4 w-4" />
          Сохранить
        </button>
        <button
          className="inline-flex items-center gap-2 rounded-xl border border-outline/40 bg-transparent px-3 py-2 text-sm text-textMuted hover:bg-surface/70 hover:text-slate-100"
          onClick={onReset}
        >
          <RefreshCw className="h-4 w-4" />
          Сбросить
        </button>
      </div>
    </div>
  );
}

function coerceDraft(draft: string, type: string): unknown {
  const t = type.toLowerCase();
  if (t === "bool" || t === "boolean") {
    return draft === "true";
  }
  if (t === "int" || t === "integer") {
    const n = parseInt(draft, 10);
    return Number.isFinite(n) ? n : 0;
  }
  if (t === "float" || t === "number") {
    const n = parseFloat(draft);
    return Number.isFinite(n) ? n : 0;
  }
  return draft;
}

function guessDescription(type: string, choices: Array<{ value: unknown; label: string; description?: string | null }>, key: string): string {
  const t = type.toLowerCase();
  const isOptional = t.includes("optional");
  if (choices && choices.length > 0) {
    if (key === "CONNECT_BUTTON_MODE") {
      return "Выберите поведение кнопки: гайд, Mini App, ссылка и т.д.";
    }
    if (key === "SUPPORT_SYSTEM_MODE") {
      return "Выберите способ обращения: тикеты, контакт или оба варианта.";
    }
    return "Выберите одно из доступных значений.";
  }
  if (t === "bool" || t === "boolean") {
    return "Переключатель параметра (включить/выключить).";
  }
  if (t === "int") {
    return isOptional ? "Целочисленный параметр. Можно оставить пустым." : "Целочисленный параметр.";
  }
  if (t === "float" || t === "number") {
    return isOptional ? "Число с точкой. Можно оставить пустым." : "Число с точкой.";
  }
  // str и прочее
  return isOptional ? "Текстовый параметр. Можно оставить пустым." : "Текстовый параметр.";
}

function buildCategorySections(categories: Array<{ key: string; label: string; items: number }>) {
  const sectionOf = (key: string) => {
    if (["PAYMENT", "YOOKASSA", "CRYPTOBOT", "MULENPAY", "PAL24", "TRIBUTE", "TELEGRAM"].some((k) => key.startsWith(k))) return { key: "payments", label: "Платежи и прием", icon: <Sliders className="h-4 w-4" /> };
    if (["REMNAWAVE", "WEBHOOK", "MINIAPP"].some((k) => key.startsWith(k))) return { key: "integrations", label: "Интеграции", icon: <Puzzle className="h-4 w-4" /> };
    if (["LOCALIZATION", "INTERFACE", "CONNECT_BUTTON"].some((k) => key.startsWith(k))) return { key: "ui", label: "Интерфейс", icon: <Layers3 className="h-4 w-4" /> };
    if (["PAID_SUBSCRIPTION", "TRIAL", "PERIODS", "SUBSCRIPTION", "TRAFFIC", "REFERRAL", "AUTOPAY"].some((k) => key.startsWith(k))) return { key: "subscriptions", label: "Подписки", icon: <Sliders className="h-4 w-4" /> };
    if (["WEB_API", "MAINTENANCE", "MONITORING", "SERVER", "BACKUP", "VERSION", "REDIS", "LOG"].some((k) => key.startsWith(k))) return { key: "system", label: "Система", icon: <Settings className="h-4 w-4" /> };
    return { key: "other", label: "Прочее", icon: <Settings className="h-4 w-4" /> };
  };

  const groups = new Map<string, { key: string; label: string; icon: JSX.Element; categories: typeof categories }>();
  for (const cat of categories) {
    const s = sectionOf(cat.key);
    if (!groups.has(s.key)) groups.set(s.key, { ...s, categories: [] });
    groups.get(s.key)!.categories.push(cat);
  }
  return Array.from(groups.values());
}

function getSettingMeta(key: string, fallbackName: string): { title: string; description?: string } {
  // If backend already localized to RU, keep it
  if (fallbackName && /[А-Яа-яЁё]/.test(fallbackName)) return { title: fallbackName };

  // Manual localization map (key -> [title, description])
  const map: Record<string, [string, string?]> = {
    WEB_API_HOST: ["Хост веб‑API", "Адрес, на котором слушает встроенный API."],
    WEB_API_PORT: ["Порт веб‑API", "Порт для подключения к встроенному API."],
    WEB_API_DEFAULT_TOKEN: ["Бутстрап‑токен API", "Создаётся при миграции и используется для первого входа."],
    REMNAWAVE_API_URL: ["RemnaWave URL", "Базовый адрес панели RemnaWave."],
    REMNAWAVE_API_KEY: ["RemnaWave API ключ", "Токен доступа к панели RemnaWave."],
    REMNAWAVE_AUTH_TYPE: ["RemnaWave: способ авторизации", "Выберите метод подключения к панели (например, API Key)."],
    REMNAWAVE_USER_DELETE_MODE: ["RemnaWave: удаление пользователей", "Стратегия при деактивации: удалить или отключить пользователя."],
    // Подписки: базовые лимиты
    DEFAULT_DEVICE_LIMIT: ["Лимит устройств по умолчанию", "Количество устройств в новой платной подписке."],
    MAX_DEVICES_LIMIT: ["Максимум устройств", "Верхний предел для подключаемых устройств."],
    PRICE_PER_DEVICE: ["Цена за доп. устройство", "Доплата за каждое устройство сверх лимита."],
    DEFAULT_TRAFFIC_LIMIT_GB: ["Трафик по умолчанию (ГБ)", "Выдаётся при создании платной подписки."],
    FIXED_TRAFFIC_LIMIT_GB: ["Фиксированный лимит трафика (ГБ)", "Если включён соответствующий режим выбора."],
    // Подписки: периоды и цены
    AVAILABLE_SUBSCRIPTION_PERIODS: ["Доступные периоды подписки", "Список поддерживаемых длительностей подписки."],
    AVAILABLE_RENEWAL_PERIODS: ["Периоды продления", "Длительности, доступные при продлении."],
    BASE_SUBSCRIPTION_PRICE: ["Базовая цена подписки", "Начальная стоимость, от которой считаются скидки."],
    // Триал
    TRIAL_DURATION_DAYS: ["Длительность триала (дни)", "Сколько дней длится триальный период."],
    TRIAL_ADD_REMAINING_DAYS_TO_PAID: [
      "Добавлять оставшиеся дни триала",
      "При оплате платной подписки к сроку добавляются неиспользованные дни триала.",
    ],
    // Трафик
    DEFAULT_TRAFFIC_RESET_STRATEGY: ["Стратегия сброса трафика", "Как обнуляется трафик: по времени или при оплате."],
    RESET_TRAFFIC_ON_PAYMENT: ["Сбрасывать трафик при оплате", "При пополнении/продлении трафик обнуляется."],
    TRAFFIC_SELECTION_MODE: ["Режим выбора трафика", "Свободный выбор пакета или фиксированный объём."],
    // Автоплатёж
    DEFAULT_AUTOPAY_DAYS_BEFORE: ["Автоплатёж: дней до окончания", "За сколько дней до конца выполняется автопродление."],
    MIN_BALANCE_FOR_AUTOPAY_KOPEKS: ["Мин. баланс для автоплатежа (коп)", "Минимум средств на балансе для автосписания."],
    // Рефералы
    REFERRED_USER_REWARD: ["Награда рефералу", "Сколько получает приглашённый пользователь."],
    // Платежи (общие тексты)
    PAYMENT_SERVICE_NAME: ["Название сервиса оплаты", "Отображается пользователям в сообщениях и квитанциях."],
    PAYMENT_BALANCE_DESCRIPTION: ["Описание пополнения баланса", "Краткое описание операции пополнения."],
    PAYMENT_SUBSCRIPTION_DESCRIPTION: ["Описание оплаты подписки", "Краткое описание операции продления подписки."],
    PAYMENT_BALANCE_TEMPLATE: ["Шаблон сообщения о пополнении", "Текст, который видит пользователь после пополнения."],
    PAYMENT_SUBSCRIPTION_TEMPLATE: ["Шаблон сообщения об оплате подписки", "Текст после успешного продления."],
    // Поддержка и обязательный канал
    SUPPORT_SYSTEM_MODE: ["Режим поддержки", "Как обращаться в поддержку: тикеты, контакт или оба варианта."],
    SUPPORT_EMAIL: ["Email поддержки", "Адрес электронной почты службы поддержки."],
    SUPPORT_TELEGRAM_LINK: ["Ссылка на поддержку в Telegram", "Ссылка или username для связи в Telegram."],
    CHANNEL_ID: ["ID обязательного канала", "Telegram‑канал для обязательной подписки (приватные начинаются с -100)."],
    CHANNEL_INVITE_LINK: ["Ссылка-приглашение в канал", "Используется для отправки ссылки пользователю."],
    
    // Уведомления и отчёты для админов
    ADMIN_NOTIFICATIONS_ENABLED: ["Уведомления админам", "Присылать системные уведомления администраторам."],
    ADMIN_NOTIFICATIONS_CHAT_ID: ["Чат уведомлений админов", "ID чата, куда прилетают системные уведомления (приватные каналы начинаются с -100)."],
    ADMIN_REPORTS_ENABLED: ["Автоотчёты админам", "Регулярные отчёты и сводки."],
    ADMIN_REPORTS_INTERVAL_HOURS: ["Период автоотчётов (часы)", "Как часто отправлять обзорные отчёты."],
    // YooKassa
    YOOKASSA_SHOP_ID: ["YooKassa Shop ID", "Идентификатор магазина в YooKassa."],
    YOOKASSA_SECRET_KEY: ["YooKassa секретный ключ", "Секретный ключ API для проведения платежей."],
    YOOKASSA_RETURN_URL: ["YooKassa URL возврата", "Куда вернуть пользователя после оплаты."],
    YOOKASSA_VAT_CODE: ["YooKassa НДС код", "Код ставки НДС для чеков."],
    YOOKASSA_PAYMENT_MODE: ["Режим оплаты YooKassa", "Способ оплаты в чеке (full_payment и т.д.)."],
    YOOKASSA_PAYMENT_SUBJECT: ["Предмет расчёта YooKassa", "Тип товара/услуги в чеке."],
    YOOKASSA_DEFAULT_RECEIPT_EMAIL: ["Email для чека по умолчанию", "Используется, если клиент не указал контакт для чека."],
    // CryptoBot / MulenPay / Pal24
    CRYPTOBOT_API_KEY: ["CryptoBot API ключ", "Токен интеграции с CryptoBot."],
    MULENPAY_API_KEY: ["MulenPay API ключ", "Токен доступа MulenPay."],
    PAL24_API_KEY: ["Pal24 API ключ", "Токен доступа к Pal24/PayPalych."],
    // Telegram Stars
    TELEGRAM_STARS_ENABLED: ["Telegram Stars: включить", "Активировать оплату через Telegram Stars."],
    // Интерфейс · Визуальные настройки
    ENABLE_LOGO_MODE: ["Показывать логотип", "Включить отображение логотипа в интерфейсе."],
    LOGO_FILE: ["Файл логотипа", "Путь или имя файла логотипа, отображаемого в интерфейсе."],
    HIDE_SUBSCRIPTION_LINK: ["Скрыть ссылку подписки", "Не показывать ссылку на подписку в интерфейсе."],
    
    // Быстрый старт / пропуск шагов
    SKIP_RULES_ACCEPT: ["Пропустить подтверждение правил", "Не спрашивать пользователя о согласии с правилами при запуске."],
    SKIP_REFERRAL_CODE: ["Пропустить ввод реферального кода", "Не спрашивать реферальный код на старте."],
    
    // Быстрый старт / Happ / Mini App уже переведены ниже...
    // Система / мониторинг / резервные копии
    WEB_API_TITLE: ["Название веб‑API", "Заголовок в документации и сервисах."],
    WEB_API_REQUEST_LOGGING: ["Логировать запросы API", "Подробное логирование всех запросов (используйте с осторожностью)."],
    WEB_API_DOCS_ENABLED: ["Показывать Swagger", "Публиковать /docs и OpenAPI для отладки."],
    WEB_API_ALLOWED_ORIGINS: ["CORS: разрешённые домены", "Список доменов с доступом к API."],
    MONITORING_LOGS_RETENTION_DAYS: ["Хранение логов (дни)", "Сколько дней хранить логи мониторинга."],
    NOTIFICATION_CACHE_HOURS: ["Кэш уведомлений (часы)", "Время жизни кэша уведомлений."],
    BACKUP_ENABLED: ["Бэкапы: включить", "Автоматически создавать резервные копии."],
    VERSION_CHECK_REPO: ["Репозиторий обновлений", "GitHub‑репозиторий для проверки версий."],
    REDIS_URL: ["Redis URL", "Подключение к Redis для кэша/очередей."],
    DEFAULT_LANGUAGE: ["Язык по умолчанию", "Стартовый язык интерфейса."],
    AVAILABLE_LANGUAGES: ["Доступные языки", "Список языков, доступных пользователю."],
    LANGUAGE_SELECTION_ENABLED: ["Выбор языка", "Разрешить пользователю менять язык интерфейса."],
    // Бэкапы — расширенные опции
    BACKUP_INCLUDE_LOGS: ["Бэкап: включать логи", "Добавлять лог‑файлы в архив бэкапа."],
    BACKUP_COMPRESS: ["Бэкап: сжимать архив", "Сжимать резервные копии для экономии места."],
    BACKUP_ENCRYPTION_ENABLED: ["Бэкап: шифрование", "Шифровать архив резервной копии."],
    BACKUP_ENCRYPTION_KEY: ["Ключ шифрования бэкапа", "Секретный ключ для шифрования/расшифровки архива."],
    BACKUP_STORAGE: ["Хранилище бэкапов", "Тип хранилища: локально, S3‑совместимое и т.п."],
    BACKUP_STORAGE_S3_BUCKET: ["S3: бакет для бэкапов", "Имя бакета в S3‑совместимом хранилище."],
    BACKUP_STORAGE_S3_REGION: ["S3: регион", "Регион хранилища (например, eu‑central‑1)."],
    BACKUP_STORAGE_S3_ENDPOINT: ["S3: endpoint", "Endpoint/URL S3‑совместимого провайдера."],
    BACKUP_STORAGE_S3_ACCESS_KEY: ["S3: Access Key", "Идентификатор ключа доступа."],
    BACKUP_STORAGE_S3_SECRET_KEY: ["S3: Secret Key", "Секретный ключ доступа к бакету."],
    BACKUP_KEEP_LAST: ["Хранить последние N бэкапов", "Количество актуальных бэкапов, которые сохраняются."],
    BACKUP_VERIFY: ["Проверка бэкапа", "Проверять целостность архива после создания."],
    // База данных
    DATABASE_URL: ["URL базы данных", "Строка подключения к базе данных (DSN)."],
    DATABASE_MODE: ["Режим БД", "Автоопределение или явный выбор (PostgreSQL/SQLite)."],
    LOCALES_PATH: ["Путь к локалям", "Каталог с JSON/YAML файлами локализации."],
    // PostgreSQL
    POSTGRES_HOST: ["PostgreSQL хост", "Имя хоста PostgreSQL."],
    POSTGRES_PORT: ["PostgreSQL порт", "Порт подключения к PostgreSQL."],
    POSTGRES_DB: ["PostgreSQL БД", "Имя базы данных PostgreSQL."],
    POSTGRES_USER: ["PostgreSQL пользователь", "Имя пользователя PostgreSQL."],
    POSTGRES_PASSWORD: ["PostgreSQL пароль", "Пароль пользователя PostgreSQL."],
    // Redis
    REDIS_HOST: ["Redis хост", "Имя хоста сервера Redis."],
    REDIS_PORT: ["Redis порт", "Порт подключения к Redis."],
    REDIS_PASSWORD: ["Redis пароль", "Пароль для подключения к Redis (если требуется)."],
    // Режим обслуживания и мониторинг
    MAINTENANCE_ENABLED: ["Режим обслуживания", "Включить отображение режима обслуживания для пользователей."],
    MAINTENANCE_MESSAGE: ["Сообщение обслуживания", "Текст, показываемый во время обслуживания."],
    MONITORING_INTERVAL: ["Интервал мониторинга (сек)", "Периодичность фоновых проверок и задач."],
    // Статус серверов / вебхуки
    SERVER_STATUS_MODE: ["Режим статуса серверов", "Источник данных для блока статуса серверов."],
    WEBHOOK_URL: ["Webhook URL", "Адрес, на который сервис шлёт уведомления."],
    WEBHOOK_SECRET: ["Webhook секрет", "Секрет для валидации вебхуков."],
    // Логи и резервные копии
    LOG_LEVEL: ["Уровень логирования", "Минимальный уровень сообщений, попадающих в логи."],
    BACKUP_DIR: ["Папка бэкапов", "Каталог, где хранятся резервные копии."],
    BACKUP_CRON: ["Расписание бэкапов (CRON)", "CRON-выражение для автоматического создания бэкапов."],
    BACKUP_RETENTION_DAYS: ["Срок хранения бэкапов (дни)", "Через сколько дней бэкапы удаляются."],
    // Бэкапы в конфиге Settings
    BACKUP_AUTO_ENABLED: ["Автобэкап: включить", "Автоматически создавать бэкапы по расписанию."],
    BACKUP_INTERVAL_HOURS: ["Интервал бэкапов (часы)", "Как часто выполнять резервное копирование."],
    BACKUP_TIME: ["Время бэкапа (часы:мин)", "Локальное время запуска бэкапа, формат HH:MM (например, 03:00)."],
    BACKUP_MAX_KEEP: ["Хранить последние N бэкапов", "Сколько последних архивов сохранять."],
    BACKUP_COMPRESSION: ["Сжатие бэкапов", "Сжимать архивы для экономии места."],
    BACKUP_LOCATION: ["Директория бэкапов", "Путь, куда сохраняются архивы."],
    BACKUP_SEND_ENABLED: ["Отправка бэкапов в Telegram", "Присылать готовые архивы в указанный чат."],
    BACKUP_SEND_CHAT_ID: ["Чат для бэкапов", "ID канала/группы для отправки бэкапов. Приватные каналы начинаются с -100."],
    BACKUP_SEND_TOPIC_ID: ["Топик для бэкапов", "ID темы (thread) в чате для отправки бэкапов."],
  };
  if (map[key]) return { title: map[key][0], description: map[key][1] };

  // Динамический маппинг цен по дням: PRICE_14_DAYS, PRICE_30_DAYS, ...
  const priceDays = key.match(/^PRICE_(\d+)_DAYS$/);
  if (priceDays) {
    const days = Number(priceDays[1]);
    return {
      title: `Цена за ${days} дн.`,
      description: `Стоимость подписки на ${days} дней.`,
    };
  }

  // Динамика: цена пакета трафика PRICE_TRAFFIC_XXGB
  const priceTraffic = key.match(/^PRICE_TRAFFIC_(\d+)GB$/);
  if (priceTraffic) {
    const gb = Number(priceTraffic[1]);
    return {
      title: `Цена пакета ${gb} ГБ`,
      description: `Стоимость пакета трафика ${gb} ГБ.`,
    };
  }
  if (key === "PRICE_TRAFFIC_UNLIMITED") {
    return { title: "Цена безлимитного трафика", description: "Стоимость безлимитного пакета трафика." };
  }

  // Generic patterns by suffix/prefix
  const generic = getGenericMetaByPattern(key);
  if (generic) return generic;

  // If backend sent English display name, try to translate common words
  const name = fallbackName || key;
  const translated = translateToRussian(name);
  if (translated) return { title: translated };

  // Fallback: beautify the key
  const beautified = key
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (m) => m.toUpperCase())
    .trim();
  return { title: beautified };
}

function translateToRussian(phrase: string): string {
  // Very lightweight token translation for common admin settings
  const dict: Record<string, string> = {
    trial: "триал",
    duration: "длительность",
    add: "добавлять",
    remaining: "оставшиеся",
    days: "дни",
    day: "день",
    to: "к",
    paid: "платной",
    subscription: "подписке",
    renewal: "продления",
    period: "период",
    price: "цена",
    base: "базовая",
    package: "пакет",
    packages: "пакеты",
    enable: "включить",
    disable: "выключить",
    mode: "режим",
    url: "URL",
    host: "хост",
    port: "порт",
    token: "токен",
    key: "ключ",
    api: "API",
    default: "по умолчанию",
    limit: "лимит",
    traffic: "трафик",
    device: "устройство",
    devices: "устройства",
    support: "поддержка",
    contact: "контакт",
    channel: "канал",
    webhook: "вебхук",
    backup: "бэкап",
    version: "версия",
    redis: "Redis",
    database: "база данных",
  };
  const words = phrase
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ");
  if (words.length === 0) return phrase;
  const ru = words.map((w) => dict[w.toLowerCase()] || w).join(" ");
  // Capitalize first letter
  return ru.charAt(0).toUpperCase() + ru.slice(1);
}

function getGenericMetaByPattern(key: string): { title: string; description?: string } | null {
  const t = key.toUpperCase();
  // Backup generic
  if (t.startsWith("BACKUP_")) {
    // If none of the specific rules matched later, show generic backup description
    // We'll still try suffix rules below to give more specific hints.
  }
  // Telegram-specific IDs
  if (((t.includes("CHANNEL") || t.includes("CHAT")) && t.endsWith("_ID")) || t === "CHANNEL_ID" || t.endsWith("_CHAT_ID")) {
    return {
      title: "ID чата Telegram",
      description: "Идентификатор канала/группы. Для приватных каналов начинается с -100."
    };
  }
  if (t.endsWith("TOPIC_ID") || t.endsWith("THREAD_ID") || (t.includes("TOPIC") && t.endsWith("_ID"))) {
    return {
      title: "ID топика (форум)",
      description: "Идентификатор темы (thread) в канале Telegram. Используется для сообщений в топиках."
    };
  }
  const bySuffix = (
    suffix: string,
    title: string,
    description?: string,
  ): { title: string; description?: string } | null => (t.endsWith(suffix) ? { title, description } : null);

  return (
    bySuffix("_URL", "URL", "Адрес ссылки или эндпоинта.") ||
    bySuffix("_TOKEN", "Токен доступа", "Секретный токен для аутентификации.") ||
    bySuffix("_KEY", "Секретный ключ", "Ключ для подписи или доступа к API.") ||
    bySuffix("_ACCESS_KEY", "Ключ доступа", "Идентификатор ключа доступа (Access Key ID).") ||
    bySuffix("_SECRET_KEY", "Секретный ключ", "Секрет для доступа к хранилищу.") ||
    bySuffix("_HOST", "Хост", "Имя хоста сервиса.") ||
    bySuffix("_PORT", "Порт", "Порт подключения.") ||
    bySuffix("_EMAIL", "Email", "Email для уведомлений/чеков.") ||
    bySuffix("_LANGUAGE", "Язык", "Код языка, например ru или en.") ||
    bySuffix("_LANGUAGES", "Доступные языки", "Список поддерживаемых языков.") ||
    bySuffix("_ENABLED", "Включено", "Активировать эту возможность.") ||
    bySuffix("_MODE", "Режим", "Выберите режим работы.") ||
    bySuffix("_PATH", "Путь", "Файловый путь или виртуальный маршрут.") ||
    bySuffix("_TTL", "TTL (в секундах)", "Время жизни кэша или конфигурации.") ||
    bySuffix("_BUCKET", "Бакет", "Имя бакета/корзины в облачном хранилище.") ||
    bySuffix("_REGION", "Регион", "Регион облачного хранилища.") ||
    bySuffix("_ENDPOINT", "Endpoint", "URL/endpoint провайдера хранилища.") ||
    bySuffix("_ID", "Идентификатор", "Уникальный ID сущности.") ||
    bySuffix("_DAYS", "Количество дней", "Числовой параметр в днях.") ||
    bySuffix("_HOURS", "Часы", "Числовой параметр в часах.") ||
    bySuffix("_MINUTES", "Минуты", "Числовой параметр в минутах.") ||
    bySuffix("_SECONDS", "Секунды", "Числовой параметр в секундах.") ||
    // Generic fallback for BACKUP_ prefix
    (t.startsWith("BACKUP_") ? { title: "Параметр бэкапов", description: "Настройка системы резервного копирования." } : null)
  );
}


