import { useEffect, useState } from "react";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

const STATUS_OPTIONS = [
  { value: "", label: "Все статусы" },
  { value: "new", label: "Новые" },
  { value: "trial", label: "Триал" },
  { value: "active", label: "Активные" },
  { value: "paused", label: "Пауза" },
  { value: "blocked", label: "Блокированные" },
  { value: "archived", label: "Архив" },
];

interface UsersFiltersProps {
  initialSearch?: string;
  initialStatus?: string;
  onChange: (filters: { search?: string; status?: string }) => void;
}

export function UsersFilters({ initialSearch, initialStatus, onChange }: UsersFiltersProps) {
  const [search, setSearch] = useState(initialSearch ?? "");
  const [status, setStatus] = useState(initialStatus ?? "");

  const debouncedSearch = useDebouncedValue(search, 400);

  useEffect(() => {
    onChange({ search: debouncedSearch || undefined, status: status || undefined });
  }, [debouncedSearch, status, onChange]);

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex w-full flex-col gap-2 lg:flex-row lg:items-center">
        <div className="relative w-full lg:max-w-sm">
          <input
            className="w-full rounded-2xl border border-outline/40 bg-surfaceMuted/60 py-2.5 pl-4 pr-3 text-sm text-slate-100 placeholder:text-textMuted focus:border-primary/80 focus:outline-none focus:ring-2 focus:ring-primary/40"
            placeholder="Поиск по имени, username, Telegram ID"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <select
          className="w-full rounded-2xl border border-outline/40 bg-surface/70 px-3 py-2 text-sm text-white focus:border-primary/70 focus:outline-none focus:ring-2 focus:ring-primary/30 lg:w-52"
          value={status}
          onChange={(event) => setStatus(event.target.value)}
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
