import { create } from "zustand";

interface ConnectionState {
  isOnline: boolean;
  setOnline: (value: boolean) => void;
}

export const useConnectionStore = create<ConnectionState>()((set, get) => ({
  isOnline: true,
  setOnline: (value) => {
    const current = get().isOnline;
    if (current === value) return;
    set({ isOnline: value });
  },
}));

export const connectionStore = {
  getState: useConnectionStore.getState,
  setState: useConnectionStore.setState,
  subscribe: useConnectionStore.subscribe,
};
