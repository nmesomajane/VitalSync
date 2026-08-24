import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import { User } from "../types";
import { setApiToken } from "../services/api";
// import the cache setter

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => Promise<void>;
  logout: () => Promise<void>;
  setLoading: (loading: boolean) => void;
}

const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: false,

  setUser: (user) => {
    if (user === null) {
      console.log("authStore: setUser null — ignored to protect existing user");
      return;
    }
    console.log("authStore: setUser:", user.email);
    set({ user });
  },

  setToken: async (token) => {
    console.log("authStore: setToken:", !!token);
    set({ token });

    // sync with API cache immediately
    setApiToken(token);
    // this ensures the interceptor has the token
    // before any API call is made

    if (token) {
      await SecureStore.setItemAsync("vitalsync_token", token);
    } else {
      await SecureStore.deleteItemAsync("vitalsync_token");
    }
  },

  logout: async () => {
    console.log("authStore: logout");
    setApiToken(null);
    await SecureStore.deleteItemAsync("vitalsync_token");
    set({ user: null, token: null });
  },

  setLoading: (isLoading) => set({ isLoading }),
}));

export default useAuthStore;