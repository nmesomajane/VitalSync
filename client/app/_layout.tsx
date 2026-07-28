// @ts-ignore: side-effect import for global CSS without type declarations
import "../global.css";
import React, { useEffect } from "react";

import { Stack, router, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SecureStore from "expo-secure-store";
import useAuthStore from "../src/store/authStore";
import {
  requestNotificationPermission,
  setupNotificationListeners,
  registerForPushNotifications,
} from "../src/services/notifications";

import api from "../src/services/api";

export default function RootLayout() {
  const { token, setToken, setLoading, setUser, isLoading } = useAuthStore();
   const segments = useSegments();

  console.log("RootLayout rendered — token present:", !!token);

  useEffect(() => {
    const restoreSession = async () => {
      setLoading(true);
      try {
        const saved = await SecureStore.getItemAsync("vitalsync_token");
        if (saved) {
          await setToken(saved);
          
          try {
            const { default: api } = await import("../src/services/api");
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
  }, []);
   useEffect(() => {
    if (isLoading) return;


    const inAuthGroup = segments[0] === "(auth)";
   

    if (!token && !inAuthGroup) {
      
      console.log("_layout: no token — redirecting to login");
      router.replace("/(auth)/login");
    } else if (token && inAuthGroup) {
     
      console.log("_layout: token found — redirecting to tabs");
      router.replace("/(tabs)");
    }
   
  }, [token, segments, isLoading]);

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
  }, []);

  useEffect(() => {
    if (token) {
      console.log("_layout: token detected — pushing to tabs");
      router.replace("/(tabs)");
    } else {
      console.log("_layout: no token — pushing to login");
      router.replace("/(auth)/login");
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

function setUser(user: any) {
  throw new Error("Function not implemented.");
}
