import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "@/components/navigation/Sidebar";
import { Topbar } from "@/components/navigation/Topbar";
import { TokenDialog } from "@/components/auth/TokenDialog";
import { useAuthStore } from "@/store/auth-store";
import { LoggedInBackground } from "@/components/shared/LoggedInBackground";

export function MainLayout() {
  const token = useAuthStore((state) => state.token);
  const jwtToken = useAuthStore((state) => state.jwtToken);
  const hydrated = useAuthStore((state) => state.hydrated);
  const [manualOpen, setManualOpen] = useState(false);
  // Показываем диалог только после гидратации стора, чтобы избежать открытия и сразу закрытия
  const requireToken = hydrated && Boolean(jwtToken) && !token;

  return (
    <div className="relative flex min-h-screen bg-background text-slate-100">
      <LoggedInBackground />
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <Topbar onOpenTokenDialog={() => setManualOpen(true)} />
        <main className="flex-1 overflow-y-auto bg-background/40 px-8 pb-12 pt-6">
          <Outlet />
        </main>
      </div>
      <TokenDialog open={requireToken || manualOpen} onClose={() => setManualOpen(false)} />
    </div>
  );
}

