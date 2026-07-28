import { Redirect } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import useAuthStore from "../src/store/authStore";
import React from "react";

export default function Index() {
  const { token, isLoading } = useAuthStore();

  console.log("index.tsx re-rendered — token:", !!token, "loading:", isLoading);

  if (isLoading) {
    return (
   <View style={{
      flex: 1,
      backgroundColor: "#0a0f1e",
      justifyContent: "center",
      alignItems: "center",
    }}>
      <ActivityIndicator size="large" color="#2563eb" />
    </View>
    );
  }

  if (token) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/(auth)/login" />;

}