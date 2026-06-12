import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import { User } from "../types";

// define the shape of the store
interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;

  // actions — functions stored alongside data in Zustand
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => Promise<void>;
  // Promise<void> = async function that returns nothing
  logout: () => Promise<void>;
  setLoading: (isLoading: boolean) => void;
}

const useAuthStore = create<AuthState>((set) => ({
  
  user: null,
  token: null,
  isLoading: false,

  setUser: (user: User | null) => {
    console.log("authStore: setUser:", user?.email ?? "null");
    set({ user });
  },

  setToken: async (token: string | null) => {
    console.log("authStore: setToken called, token present:", !!token);
    set({ token });

    if (token) {
      await SecureStore.setItemAsync("vitalsync_token", token);
      console.log("authStore: token saved to SecureStore");
    } else {
      await SecureStore.deleteItemAsync("vitalsync_token");
      console.log("authStore: token removed from SecureStore");
    }
  },

  logout: async () => {
    console.log("authStore: logging out");
    await SecureStore.deleteItemAsync("vitalsync_token");
    set({ user: null, token: null });
    console.log("authStore: logout complete");
  },

  setLoading: (isLoading: boolean) => set({ isLoading }),
}));

export default useAuthStore;