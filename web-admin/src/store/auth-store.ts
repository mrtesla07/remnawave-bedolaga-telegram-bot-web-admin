import { create } from "zustand";
import { persist } from "zustand/middleware";
import { defaultApiBaseUrl } from "@/lib/config";

interface AuthState {
  token: string | null; // legacy API key
  jwtToken: string | null; // admin JWT
  apiBaseUrl: string;
  hydrated: boolean;
  username: string | null;
  name: string | null;
  setToken: (token: string | null) => void;
  setJwtToken: (token: string | null) => void;
  setApiBaseUrl: (url: string) => void;
  setHydrated: (value: boolean) => void;
  setUsername: (username: string | null) => void;
  setName: (name: string | null) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      jwtToken: null,
      apiBaseUrl: defaultApiBaseUrl,
      hydrated: false,
      username: null,
      name: null,
      setToken: (token) => set({ token }),
      setJwtToken: (jwtToken) => set({ jwtToken }),
      setApiBaseUrl: (apiBaseUrl) => set({ apiBaseUrl }),
      setHydrated: (value) => set({ hydrated: value }),
      setUsername: (username) => set({ username }),
      setName: (name) => set({ name }),
      clear: () => set({ token: null, jwtToken: null, username: null, name: null }),
    }),
    {
      name: "bedolaga-web-admin-auth",
      onRehydrateStorage: () => (state) => {
        try {
          // mark store as hydrated once persistence finishes
          useAuthStore.getState().setHydrated(true);
        } catch {}
      },
    },
  ),
);

export const authStore = {
  getState: useAuthStore.getState,
  setState: useAuthStore.setState,
  subscribe: useAuthStore.subscribe,
};

