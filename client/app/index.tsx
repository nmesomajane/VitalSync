import { Redirect } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import useAuthStore from "../src/store/authStore";
import React from 'react'

export default function Index() {
  const { token, isLoading } = useAuthStore();
  // reads from global Zustand store
  // _layout.tsx set the token (or left it null)
  // this component reacts to that value

  console.log("index.tsx — token:", !!token, "| loading:", isLoading);

  if (isLoading) {
    // _layout.tsx is still checking SecureStore
    // show a spinner instead of a flash of the wrong screen
    console.log("index.tsx: still loading — showing spinner");
    return (
      <View style={{ flex: 1, backgroundColor: "#080c14", justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#e94560" />
      </View>
    );
  }

  if (token) {
    console.log("index.tsx: token exists — sending to main app");
    return <Redirect href="/(tabs)/index" />;
    // Redirect renders nothing visible
    // it immediately navigates to /(tabs)
   
  }

  console.log("index.tsx: no token — sending to login");
  return <Redirect href="/(auth)/login" />;
  // sends to login screen

}