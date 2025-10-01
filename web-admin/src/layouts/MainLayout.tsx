import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "@/components/navigation/Sidebar";
import { Topbar } from "@/components/navigation/Topbar";
import { TokenDialog } from "@/components/auth/TokenDialog";
import { useAuthStore } from "@/store/auth-store";

export function MainLayout() {
  const token = useAuthStore((state) => state.token);
  const [isTokenDialogOpen, setTokenDialogOpen] = useState(() => !token);

  useEffect(() => {
    if (!token) {
      setTokenDialogOpen(true);
    }
  }, [token]);

  return (
    <div className="relative flex min-h-screen bg-background text-slate-100">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(110,89,245,0.25),transparent_55%)]" />
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <Topbar onOpenTokenDialog={() => setTokenDialogOpen(true)} />
        <main className="flex-1 overflow-y-auto bg-background/40 px-8 pb-12 pt-6">
          <Outlet />
        </main>
      </div>
      <TokenDialog open={isTokenDialogOpen} onClose={() => setTokenDialogOpen(false)} />
    </div>
  );
}

