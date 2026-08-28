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

console.log("=================================");
console.log("API SERVICE INITIALISED");
console.log("Base URL:", API_URL);
console.log("=================================");

let cachedToken: string | null = null;



// call this after every login and logout
export const setApiToken = (token: string | null) => {
  cachedToken = token;
  console.log("API: token cache updated:", !!token);
};

api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const isPublicRoute =
      config.url?.includes("/auth/signin") ||
      config.url?.includes("/auth/signup");

    if (!isPublicRoute) {
      let token = cachedToken;

      if (!token) {
        token = await SecureStore.getItemAsync("vitalsync_token");

        if (token) {
          cachedToken = token;
        }
      }

      if (token) {
  config.headers.Authorization = `Bearer ${token}`;

  console.log(
    `📤 ${config.method?.toUpperCase()} ${config.url} [authenticated]`
  );

  console.log(" Token exists:", !!token);
  console.log(" Token parts:", token.split(".").length);
} else {
        console.log(
          `📤 ${config.method?.toUpperCase()} ${config.url} [NO TOKEN]`
        );
      }
    } else {
      console.log(
        `📤 ${config.method?.toUpperCase()} ${config.url} [public]`
      );
    }

    return config;
  },
  (error) => {
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
      console.log("⚠️ 401 received from:", error.config?.url);

      // DO NOT clear the token automatically for now
      console.log("Token was NOT cleared");
    }

    return Promise.reject(error);
  }
);

export default api;