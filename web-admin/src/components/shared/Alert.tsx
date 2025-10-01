import clsx from "clsx";
import { AlertCircle, Info, TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";

const toneMap = {
  info: { icon: Info, className: "bg-surfaceMuted/50 border-outline/40 text-textMuted" },
  warning: { icon: TriangleAlert, className: "bg-warning/10 border-warning/40 text-warning" },
  error: { icon: AlertCircle, className: "bg-danger/10 border-danger/40 text-danger" },
};

interface AlertProps {
  title: string;
  description?: ReactNode;
  tone?: keyof typeof toneMap;
}

export function Alert({ title, description, tone = "info" }: AlertProps) {
  const toneConfig = toneMap[tone];
  const Icon = toneConfig.icon;

  return (
    <div className={clsx("flex gap-3 rounded-2xl border px-4 py-3", toneConfig.className)}>
      <Icon className="mt-1 h-5 w-5" />
      <div className="space-y-1 text-sm">
        <p className="font-semibold">{title}</p>
        {description ? <div className="text-xs leading-relaxed text-current/80">{description}</div> : null}
      </div>
    </div>
  );
}


