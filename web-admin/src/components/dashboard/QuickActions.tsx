import clsx from "clsx";
import type { ComponentType } from "react";
import { ArrowRight, Bot, Megaphone, RefreshCw, Ticket } from "lucide-react";
import type { QuickAction } from "@/types/dashboard";

const iconMap: Record<QuickAction["action"], ComponentType<{ className?: string }>> = {
  promo: Ticket,
  broadcast: Megaphone,
  bot: Bot,
  sync: RefreshCw,
};

interface QuickActionsProps {
  actions: QuickAction[];
}

export function QuickActions({ actions }: QuickActionsProps) {
  return (
    <div className="rounded-3xl border border-outline/40 bg-surfaceMuted/40 p-4">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {actions.map((action, index) => {
          const Icon = iconMap[action.action];
          const isPrimary = index === 0;
          return (
            <button
              key={action.action}
              type="button"
              className={clsx(
                "group flex items-center justify-between gap-4 rounded-full border px-5 py-4 text-left transition",
                isPrimary
                  ? "border-transparent bg-gradient-to-r from-primary/80 via-primary/70 to-sky/50 text-white shadow-card"
                  : "border-outline/40 bg-surface/50 text-textMuted hover:border-primary/40 hover:text-slate-100",
              )}
            >
              <span className="flex items-center gap-3">
                <span
                  className={clsx(
                    "rounded-full p-2",
                    isPrimary
                      ? "bg-white/10 text-white"
                      : "bg-surfaceMuted/70 text-primary group-hover:bg-primary/10 group-hover:text-primary",
                  )}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <span>
                  <span className="block text-sm font-semibold">{action.label}</span>
                  <span className="block text-xs text-current/70">{action.description}</span>
                </span>
              </span>
              <ArrowRight
                className={clsx("h-4 w-4", isPrimary ? "text-white" : "text-textMuted group-hover:text-slate-200")}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}


