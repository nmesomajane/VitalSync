import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from "axios";
import * as SecureStore from "expo-secure-store";

const API_URL = "http://192.168.1.91:3000";
// ↑ THIS is most likely your problem
// replace x with your computer's actual IP
// run "ipconfig" on Windows → look for IPv4 Address under WiFi

console.log("🔌 API_URL is:", API_URL);

const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await SecureStore.getItemAsync("vitalsync_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    console.log(`📤 ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    return config;
  },
  (error: AxiosError) => {
    console.error("❌ Request error:", error.message);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    console.log(`✅ ${response.status} from ${response.config.url}`);
    return response;
  },
  async (error: AxiosError) => {
    // ── IMPROVED ERROR LOGGING ────────────────────────────
    if (error.response) {
      // server responded with an error status (4xx, 5xx)
      console.error("❌ Server error:", {
        status: error.response.status,
        message: (error.response.data as any)?.message,
        url: error.config?.url,
      });
    } else if (error.request) {
      // request was made but no response received
      // THIS is what "Signup error: {}" means
      console.error("❌ No response from server — connection failed");
      console.error("❌ Check that:");
      console.error("   1. Backend server is running on port 3000");
      console.error("   2. API_URL is your computer WiFi IP not localhost");
      console.error("   3. Both phone and computer on same WiFi");
      console.error("   4. Windows Firewall allows port 3000");
    } else {
      console.error("❌ Request setup error:", error.message);
    }

    if (error.response?.status === 401) {
      await SecureStore.deleteItemAsync("vitalsync_token");
    }

    return Promise.reject(error);
  }
);

export default api;