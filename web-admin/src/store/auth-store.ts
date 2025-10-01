import { create } from "zustand";
import { persist } from "zustand/middleware";
import { defaultApiBaseUrl } from "@/lib/config";

interface AuthState {
  token: string | null;
  apiBaseUrl: string;
  setToken: (token: string | null) => void;
  setApiBaseUrl: (url: string) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      apiBaseUrl: defaultApiBaseUrl,
      setToken: (token) => set({ token }),
      setApiBaseUrl: (apiBaseUrl) => set({ apiBaseUrl }),
      clear: () => set({ token: null }),
    }),
    { name: "bedolaga-web-admin-auth" },
  ),
);

export const authStore = {
  getState: useAuthStore.getState,
  setState: useAuthStore.setState,
  subscribe: useAuthStore.subscribe,
};

