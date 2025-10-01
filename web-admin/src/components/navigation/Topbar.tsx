import { Bell, ChevronDown, CircleUser, Globe, KeyRound, Search, ShieldCheck, SlidersHorizontal } from "lucide-react";

interface TopbarProps {
  onOpenTokenDialog: () => void;
}

export function Topbar({ onOpenTokenDialog }: TopbarProps) {
  return (
    <header className="sticky top-0 z-40 flex h-20 items-center justify-between border-b border-outline/40 bg-background/80 px-8 backdrop-blur-lg">
      <div className="flex flex-1 items-center gap-4">
        <div className="relative hidden max-w-md flex-1 items-center lg:flex">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-textMuted" />
          <input
            className="w-full rounded-full border border-outline/50 bg-surfaceMuted/60 py-2.5 pl-11 pr-4 text-sm text-slate-100 placeholder:text-textMuted focus:border-primary/80 focus:outline-none focus:ring-2 focus:ring-primary/40"
            placeholder="Поиск по пользователям, ID, email..."
          />
        </div>
        <button className="hidden h-10 items-center gap-2 rounded-full border border-outline/40 bg-surfaceMuted/60 px-4 text-sm font-medium text-textMuted transition hover:border-outline hover:text-slate-100 lg:inline-flex">
          <SlidersHorizontal className="h-4 w-4" />
          Фильтры
        </button>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-primary">
          <span className="flex h-2 w-2 items-center justify-center">
            <span className="h-2 w-2 rounded-full bg-primary shadow-[0_0_0_4px_rgba(110,89,245,0.35)]" />
          </span>
          бот активен
        </div>
        <button className="relative hidden h-10 w-10 items-center justify-center rounded-xl border border-outline/40 bg-surfaceMuted/60 text-textMuted transition hover:border-outline hover:text-slate-100 lg:flex">
          <ShieldCheck className="h-4 w-4" />
          <span className="sr-only">Статус системы</span>
        </button>
        <button className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-outline/40 bg-surfaceMuted/60 text-textMuted transition hover:border-outline hover:text-slate-100">
          <Bell className="h-4 w-4" />
          <span className="absolute -right-0.5 -top-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-danger text-[10px] font-semibold text-white">3</span>
          <span className="sr-only">Уведомления</span>
        </button>
        <button
          className="relative hidden h-10 w-10 items-center justify-center rounded-xl border border-outline/40 bg-surfaceMuted/60 text-textMuted transition hover:border-outline hover:text-slate-100 lg:flex"
          onClick={onOpenTokenDialog}
          type="button"
        >
          <KeyRound className="h-4 w-4" />
          <span className="sr-only">Настроить API токен</span>
        </button>
        <button className="flex items-center gap-3 rounded-full border border-outline/40 bg-surfaceMuted/60 px-3 py-2 text-sm font-medium text-slate-100 transition hover:border-outline">
          <CircleUser className="h-7 w-7 text-primary" />
          <div className="hidden text-left md:block">
            <p className="text-sm font-semibold leading-4">Admin</p>
            <p className="text-xs text-textMuted">Главный бедолага</p>
          </div>
          <ChevronDown className="h-4 w-4 text-textMuted" />
        </button>
        <button className="hidden h-10 items-center gap-2 rounded-full border border-outline/40 bg-surfaceMuted/60 px-4 text-sm font-medium text-textMuted transition hover:border-outline hover:text-slate-100 lg:inline-flex">
          <Globe className="h-4 w-4" />
          RU
        </button>
      </div>
    </header>
  );
}
