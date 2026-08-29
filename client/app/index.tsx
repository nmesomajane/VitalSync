import React from "react";
import { Redirect } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import useAuthStore from "../src/store/authStore";


export default function Index() {
  const { token, isLoading } = useAuthStore();

  console.log(
    "INDEX:",
    "token =",
    !!token,
    "loading =",
    isLoading
  );

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#0a0f1e",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator
          size="large"
          color="#2563eb"
        />
      </View>
    );
  }

  if (token) {
    console.log("INDEX: authenticated → tabs");

    return <Redirect href="/(tabs)" />;
  }

  console.log("INDEX: unauthenticated → login");

  return <Redirect href="/(auth)/login" />;
}