import { Stack } from "expo-router";

export default function AuthLayout() {
  console.log("AuthLayout rendered");
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#080c14" } }}>
      <Stack.Screen name="login"  />
      <Stack.Screen name="signup" />
    </Stack>
  );
}