// @ts-ignore: side-effect import for global CSS without type declarations
import "../global.css"
import React, { useEffect } from "react";

import { Stack, router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SecureStore from "expo-secure-store";
import useAuthStore from "../src/store/authStore";


export default function RootLayout() {
  const { token, setToken, setLoading } = useAuthStore();

  console.log("RootLayout rendered — token present:", !!token);

  useEffect(() => {
    const restoreSession = async () => {
      console.log("_layout: checking SecureStore");
      setLoading(true);

      try {
        const saved = await SecureStore.getItemAsync("vitalsync_token");
        if (saved) {
          console.log("_layout: token found");
          await setToken(saved);
        }
      } catch (e) {
        console.error("_layout: error:", e);
      } finally {
        setLoading(false);
      }
    };
    restoreSession();
  }, []);

  
  useEffect(() => {
    if (token) {
      console.log("_layout: token detected — pushing to tabs");
      router.replace("/(tabs)");
    }
  }, [token]);
  

  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </>
  );
}