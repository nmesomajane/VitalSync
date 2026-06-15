import axios from "axios";
import type { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from "axios";
import * as SecureStore from "expo-secure-store";

const API_URL = "http://10.42.191.221:3000";
// replace x.x with your actual local IP
// run ipconfig (Windows) or ifconfig (Mac) to find it

console.log("API service initialised with URL:", API_URL);

const api: AxiosInstance = axios.create({
  // AxiosInstance is the TypeScript type for the axios instance
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// request interceptor
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await SecureStore.getItemAsync("vitalsync_token");

    if (token) {
     
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      } as any; 
      
      console.log("Request interceptor: token attached");
    } else {
      console.log("Request interceptor: no token — unauthenticated");
    }

    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error: AxiosError) => {
    console.error("Request interceptor error:", error.message);
    return Promise.reject(error);
  }
);

// response interceptor
api.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  async (error: AxiosError) => {
    console.error("API Error:", {
      status: error.response?.status,
      message: (error.response?.data as any)?.message,
      url: error.config?.url,
    });

    if (error.response?.status === 401) {
      console.log("401 — clearing stored token");
      await SecureStore.deleteItemAsync("vitalsync_token");
    }

    return Promise.reject(error);
  }
);

export default api;