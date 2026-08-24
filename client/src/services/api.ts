import * as axios from "axios";
import type { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from "axios";
import * as SecureStore from "expo-secure-store";

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "https://vitalsync-gyfr.onrender.com";

console.log("API: connecting to:", API_URL);

const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 60000,
  headers: { "Content-Type": "application/json" },
});


let cachedToken: string | null = null;

// call this after every login and logout
export const setApiToken = (token: string | null) => {
  cachedToken = token;
  console.log("API: token cache updated:", !!token);
};

api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // try memory cache first (fast)
    let token = cachedToken;

    if (!token) {
      // fall back to SecureStore (slower but persistent)
      token = await SecureStore.getItemAsync("vitalsync_token");
      if (token) {
        cachedToken = token;
        // update cache so next request is fast
      }
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log(`📤 ${config.method?.toUpperCase()} ${config.url} [authenticated]`);
    } else {
      console.log(`📤 ${config.method?.toUpperCase()} ${config.url} [NO TOKEN]`);
    }

    return config;
  },
  (error: AxiosError) => {
    console.error("Request error:", error.message);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    console.log(`✅ ${response.status} ${response.config.url}`);
    return response;
  },
  async (error: AxiosError) => {
    console.error("❌ API Error:", {
      status: error.response?.status,
      message: (error.response?.data as any)?.message,
      url: error.config?.url,
    });

    if (error.response?.status === 401) {
      console.log("401 detected — clearing token cache");
      cachedToken = null;
      await SecureStore.deleteItemAsync("vitalsync_token");
    }

    return Promise.reject(error);
  }
);

export default api;