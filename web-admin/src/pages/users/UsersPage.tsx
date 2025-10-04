import { useCallback, useMemo, useState } from "react";
import { useUsersList } from "@/features/users/queries";
import { UsersFilters } from "@/components/users/UsersFilters";
import { UsersTable } from "@/components/users/UsersTable";
import { UserDetailsDrawer } from "@/components/users/UserDetailsDrawer";
import type { User } from "@/types/users";

const PAGE_SIZE = 20;

export function UsersPage() {
  const { data, params, setParams, isLoading, isFetching } = useUsersList({ limit: PAGE_SIZE, offset: 0 });
  const [selected, setSelected] = useState<User | null>(null);

  const canPrev = (params.offset ?? 0) > 0;
  const canNext = data ? (params.offset ?? 0) + (params.limit ?? PAGE_SIZE) < data.total : false;

  const meta = useMemo(() => {
    if (!data) return "";
    const start = (data.offset ?? 0) + 1;
    const end = Math.min((data.offset ?? 0) + (data.limit ?? PAGE_SIZE), data.total);
    return `${start}–${end} из ${data.total}`;
  }, [data]);

  const handleFiltersChange = useCallback(
    (filters: { search?: string; status?: string }) => {
      setParams((prev) => ({
        ...prev,
        search: filters.search,
        status: filters.status,
        offset: 0,
      }));
    },
    [setParams],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-white">Пользователи</h1>
        <p className="text-sm text-textMuted">Управление клиентами, балансом и статусами подписок.</p>
      </div>

      <UsersFilters initialSearch={params.search} initialStatus={params.status} onChange={handleFiltersChange} />

      <UsersTable items={data?.items ?? []} isLoading={isLoading || isFetching} onSelect={(user) => setSelected(user)} />

      <div className="flex items-center justify-between rounded-2xl border border-outline/40 bg-surfaceMuted/40 px-4 py-3 text-sm text-textMuted">
        <span>{meta}</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="button-ghost"
            disabled={!canPrev}
            onClick={() => {
              setParams((prev) => ({
                ...prev,
                offset: Math.max((prev.offset ?? 0) - (prev.limit ?? PAGE_SIZE), 0),
              }));
            }}
          >
            Назад
          </button>
          <button
            type="button"
            className="button-primary"
            disabled={!canNext}
            onClick={() => {
              setParams((prev) => ({
                ...prev,
                offset: (prev.offset ?? 0) + (prev.limit ?? PAGE_SIZE),
              }));
            }}
          >
            Далее
          </button>
        </div>
      </div>

      <UserDetailsDrawer user={selected} isOpen={Boolean(selected)} onClose={() => setSelected(null)} />
    </div>
  );
}
