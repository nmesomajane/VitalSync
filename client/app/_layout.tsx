// @ts-ignore: side-effect import for global CSS without type declarations
import "../global.css"
import React from "react";
import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SecureStore from "expo-secure-store";
import * as SplashScreen from "expo-splash-screen";
import useAuthStore from "../src/store/authStore";

// keep splash screen visible while we check for stored token
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { token, setToken, setLoading } = useAuthStore();

  console.log("RootLayout rendered — token present:", !!token);

  useEffect(() => {
    const checkToken = async () => {
      console.log("RootLayout: checking SecureStore for saved token");
      setLoading(true);

      try {
        const stored = await SecureStore.getItemAsync("vitalsync_token");

        if (stored) {
          console.log("RootLayout: token found — restoring session");
          await setToken(stored);
        } else {
          console.log("RootLayout: no token — user must login");
        }
      } catch (error) {
        console.error("RootLayout: token check failed:", error);
      } finally {
        setLoading(false);
        await SplashScreen.hideAsync();
        // hide splash screen once we know the auth state
      }
    };

    checkToken();
  }, []);

  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        {/*
          Expo Router uses these screens based on the files in app/
          Each Stack.Screen name must match the folder/file name exactly
        */}
        <Stack.Screen name="(auth)" />
        {/* (auth) folder = login and signup screens */}
        <Stack.Screen name="(tabs)" />
        {/* (tabs) folder = main app screens with bottom tab bar */}
      </Stack>
    </>
  );
}