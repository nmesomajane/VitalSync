// @ts-ignore: side-effect import for global CSS without type declarations
import "../global.css";
import React, { useEffect } from "react";

import { Stack, useRouter,  } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SecureStore from "expo-secure-store";
import useAuthStore from "../src/store/authStore";
import {
  requestNotificationPermission,
  setupNotificationListeners,

} from "../src/services/notifications";

import api from "../src/services/api";

export default function RootLayout() {
  const { token, setToken, setLoading, setUser} = useAuthStore();

   const router = useRouter();
  

  console.log("RootLayout rendered — token present:", !!token);

  useEffect(() => {
    const restoreSession = async () => {
      setLoading(true);
      try {
        const saved = await SecureStore.getItemAsync("vitalsync_token");
        if (saved) {
          await setToken(saved);
          
          try {
      
            const res = await api.get("/api/v1/auth/profile");
            setUser(res.data.user);
          } catch {
            
            await SecureStore.deleteItemAsync("vitalsync_token");
            await setToken(null);
          }
        }
      } catch (e) {
        console.error("_layout: restore error:", e);
      } finally {
        setLoading(false);
      }
    };
    restoreSession();
  }, [setLoading, setToken, setUser]);



  useEffect(() => {
    requestNotificationPermission();

    const cleanup = setupNotificationListeners(
      (medicationId) => {
        console.log("Tapped medication notification:", medicationId);
        router.push("/(tabs)/profile");
      },
      () => {
        console.log("Tapped alert notification");
        router.push("/(tabs)/history");
      },
    );

    return cleanup;
  }, [router]);

 

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

