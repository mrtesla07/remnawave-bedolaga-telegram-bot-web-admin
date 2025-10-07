import type { MouseEvent } from "react";
import { useMemo } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { clsx } from "clsx";
import { NAV_SECTIONS, type NavItem } from "./nav-data";
import { CircleDot, Menu, BookOpen } from "lucide-react";

export function Sidebar() {
  const location = useLocation();

  const currentPath = useMemo(() => {
    if (location.pathname === "/") {
      return "/";
    }
    return location.pathname.replace(/\/$/, "");
  }, [location.pathname]);

  return (
    <aside className="hidden w-72 shrink-0 flex-col gap-6 border-r border-outline/50 bg-surface/80 px-5 py-6 text-sm backdrop-blur-lg lg:flex">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-sky">
            <CircleDot className="h-5 w-5" />
          </div>
          <div>
            <p className="text-base font-semibold">BedolagaAdmin</p>
            <p className="text-xs uppercase tracking-[0.24em] text-textMuted">vpn control</p>
          </div>
        </div>
        <button type="button" className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-outline/40 bg-surfaceMuted/50 text-textMuted transition hover:border-outline hover:text-slate-200">
          <Menu className="h-4 w-4" />
          <span className="sr-only">Свернуть меню</span>
        </button>
      </div>

      <div className="space-y-6 overflow-y-auto pb-6 pr-2 text-[13px] leading-5">
        {NAV_SECTIONS.map((section) => (
          <div key={section.title} className="space-y-3">
            <p className="px-3 text-xs uppercase tracking-[0.32em] text-textMuted/70">
              {section.title}
            </p>
            <nav className="flex flex-col gap-1">
              {section.items.map((item) => (
                <SidebarLink
                  key={item.label}
                  item={item}
                  isActive={currentPath === item.to}
                  disabled={item.isSoon}
                  fallbackPath={currentPath}
                />
              ))}
            </nav>
          </div>
        ))}
      </div>
      <div className="mt-auto pt-4">
        <NavLink
          to="/faq-api"
          className="group flex items-center justify-between rounded-xl px-3 py-2.5 text-textMuted transition hover:bg-surfaceMuted/60"
        >
          <span className="flex items-center gap-3">
            <BookOpen className="h-4 w-4 text-textMuted/80 group-hover:text-slate-200" />
            <span className="font-medium">FAQ по API</span>
          </span>
        </NavLink>
      </div>
    </aside>
  );
}

interface SidebarLinkProps {
  item: NavItem;
  isActive: boolean;
  disabled?: boolean;
  fallbackPath: string;
}

function SidebarLink({ item, isActive, disabled, fallbackPath }: SidebarLinkProps) {
  const className = clsx(
    "group flex w-full items-center justify-between rounded-xl px-3 py-2.5 transition",
    disabled && "cursor-not-allowed opacity-70",
    isActive
      ? "bg-gradient-to-r from-primary/80 via-primary/60 to-sky/40 text-white shadow-card"
      : "text-textMuted hover:bg-surfaceMuted/60",
  );

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (disabled) {
      event.preventDefault();
      event.stopPropagation();
    }
  };

  return (
    <NavLink
      to={disabled ? fallbackPath : item.to}
      onClick={handleClick}
      className={className}
      aria-disabled={disabled}
      tabIndex={disabled ? -1 : 0}
    >
      <span className="flex items-center gap-3">
        <item.icon className={clsx("h-4 w-4", isActive ? "text-white" : "text-textMuted/80 group-hover:text-slate-200")} />
        <span className="font-medium">{item.label}</span>
      </span>
      {item.badge ? (
        <span className="badge bg-primary/30 text-xs uppercase text-slate-200">{item.badge}</span>
      ) : null}
      {disabled ? (
        <span className="rounded-full border border-outline/40 px-2 py-0.5 text-[10px] uppercase tracking-widest text-textMuted/80">
          скоро
        </span>
      ) : null}
    </NavLink>
  );
}


