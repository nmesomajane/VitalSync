import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from "react-native";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";

import api from "../../src/services/api";
import useAuthStore from "../../src/store/authStore";
import { Ionicons } from "@expo/vector-icons";

import { AuthResponse, FormErrors, LoginPayload } from "../../src/types";

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  console.log("LoginScreen rendered");

  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [errors, setErrors] = useState<FormErrors<LoginPayload>>({});
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const { setUser, setToken } = useAuthStore();
  const [slowConnection, setSlowConnection] = useState(false);

  const validate = (): boolean => {
    const newErrors: FormErrors<LoginPayload> = {};

    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Invalid email format";
    }

    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password = "Minimum 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async (): Promise<void> => {
    if (!validate()) return;
    setIsLoading(true);
    setSlowConnection(false);

    // show "waking up server" message after 5 seconds
    const slowTimer = setTimeout(() => {
      setSlowConnection(true);
      console.log("Login: server taking long — likely waking from sleep");
    }, 5000);

    try {
      const response = await api.post<AuthResponse>("/api/v1/auth/signin", {
        email: email.trim().toLowerCase(),
        password,
      });

      clearTimeout(slowTimer);
      setSlowConnection(false);

      setUser(response.data.user);
      await setToken(response.data.token);
    } catch (error: any) {
      clearTimeout(slowTimer);
      setSlowConnection(false);

      console.log("Login error status:", error?.response?.status);
      console.log("Login error message:", error?.response?.data?.message);
      console.log("Login error type:", error?.code);
      // ECONNABORTED = timeout, ENOTFOUND = no internet

      Alert.alert(
        "Login Failed",
        error.code === "ECONNABORTED"
          ? "Server is waking up. Please try again in 30 seconds."
          : (error.response?.data?.message ?? "Check your connection."),
        [{ text: "OK" }],
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-dark"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        className="px-6"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="items-center mt-20 mb-12">
          <Text className="text-4xl mb-3">❤️</Text>
          <Text className="text-3xl font-extrabold text-white tracking-tight">
            VitalSync
          </Text>
          <Text className="text-sm text-muted mt-2">
            Monitor your health in real time
          </Text>
        </View>

        {/* Email field */}
        <View className="mb-4">
          <Text className="text-xs font-bold text-muted tracking-widest uppercase mb-2">
            Email
          </Text>
          <TextInput
            className={`bg-card rounded-xl px-4 py-4 text-white text-base border ${
              errors.email ? "border-primary" : "border-border"
            }`}
            // className works because NativeWind converts Tailwind classes
            // to React Native StyleSheet objects at compile time
            placeholder="your@email.com"
            placeholderTextColor="#475569"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (errors.email) setErrors((p) => ({ ...p, email: undefined }));
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {errors.email && (
            <Text className="text-primary text-xs mt-1">{errors.email}</Text>
          )}
        </View>

        {/* Password field */}
        {/* Password field */}
        <View style={{ marginBottom: 32 }}>
          <Text
            style={{
              fontSize: 11,
              fontWeight: "700",
              color: "#64748b",
              letterSpacing: 1,
              marginBottom: 8,
              textTransform: "uppercase",
            }}
          >
            Password
          </Text>

          {/* Wrapper View — positions input and icon together */}
          <View style={{ position: "relative" }}>
            <TextInput
              style={{
                backgroundColor: "#0f1923",
                borderWidth: 1,
                borderColor: errors.password ? "#e94560" : "#1e293b",
                borderRadius: 12,
                padding: 14,
                paddingRight: 48,
                // ↑ paddingRight: 48 makes room for the eye icon
                // without this the text types underneath the icon
                fontSize: 15,
                color: "#f1f5f9",
              }}
              placeholder="••••••••"
              placeholderTextColor="#475569"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (errors.password)
                  setErrors((p) => ({ ...p, password: undefined }));
              }}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
            />

            {/* Eye icon button — positioned inside the input on the right */}
            <TouchableOpacity
              onPress={() => {
                console.log("Password visibility toggled:", !showPassword);
                setShowPassword((prev) => !prev);
                // toggle between true and false on every press
              }}
              style={{
                position: "absolute",
                right: 14,
                top: 0,
                bottom: 0,
                justifyContent: "center",
                padding: 4,
              }}
              activeOpacity={0.6}
            >
              <Ionicons
                name={showPassword ? "eye-off-outline" : "eye-outline"}
                size={20}
                color="#475569"
              />
            </TouchableOpacity>
          </View>

          {errors.password && (
            <Text style={{ color: "#e94560", fontSize: 12, marginTop: 5 }}>
              {errors.password}
            </Text>
          )}
        </View>

        {/* Login button */}
        <TouchableOpacity
          style={{
            backgroundColor: isLoading ? "#7f1d35" : "#2563eb",
            borderRadius: 14,
            padding: 16,
            alignItems: "center",
            marginBottom: 16,
          }}
          onPress={handleLogin}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <View style={{ alignItems: "center", gap: 6 }}>
              <ActivityIndicator color="white" size="small" />
              {slowConnection && (
                <Text
                  style={{
                    color: "rgba(255,255,255,0.8)",
                    fontSize: 11,
                    marginTop: 4,
                  }}
                >
                  Server waking up... please wait
                </Text>
              )}
            </View>
          ) : (
            <Text style={{ color: "white", fontSize: 16, fontWeight: "700" }}>
              Sign In
            </Text>
          )}
        </TouchableOpacity>

        {/* Divider */}
        {/* <View className="flex-row items-center mb-4">
          <View className="flex-1 h-px bg-border" />
          <Text className="text-muted text-xs px-3">or continue with</Text>
          <View className="flex-1 h-px bg-border" />
        </View> */}

        {/* Google sign in button */}

        {/* Navigate to signup */}
        <TouchableOpacity
          className="items-center py-3 mb-8"
          onPress={() => {
            console.log("Navigating to signup");
            router.push("/(auth)/signup");
            // router.push = navigate and keep login in history
            // user can press back to return to login
          }}
        >
          <Text className="text-muted text-sm">
            Dont have an account?{" "}
            <Text className="text-blue-400 font-bold">Create one</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
