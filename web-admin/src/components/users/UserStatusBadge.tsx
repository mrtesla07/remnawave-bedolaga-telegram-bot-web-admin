import clsx from "clsx";
import type { UserStatus } from "@/types/users";

const LABELS: Record<string, string> = {
  new: "Новый",
  trial: "Триал",
  active: "Активен",
  paused: "Пауза",
  blocked: "Блокирован",
  archived: "Архив",
};

const COLORS: Record<string, string> = {
  new: "bg-sky/15 text-sky",
  trial: "bg-warning/15 text-warning",
  active: "bg-success/15 text-success",
  paused: "bg-primary/15 text-primary",
  blocked: "bg-danger/15 text-danger",
  archived: "bg-textMuted/15 text-textMuted",
};

interface UserStatusBadgeProps {
  status: string | UserStatus;
}

export function UserStatusBadge({ status }: UserStatusBadgeProps) {
  const normalized = (status || "").toString().toLowerCase();
  const label = LABELS[normalized] ?? status;
  const color = COLORS[normalized] ?? "bg-surfaceMuted/60 text-textMuted";
  return <span className={clsx("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", color)}>{label}</span>;
}
