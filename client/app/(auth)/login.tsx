import { useState } from "react";
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
import * as Google from "expo-auth-session/providers/google";
import api from "../../src/services/api";
import useAuthStore from "../../src/store/authStore";
import { Ionicons } from "@expo/vector-icons";

import { AuthResponse, FormErrors, LoginPayload } from "../../src/types";
import React from "react";

// required for Google OAuth to work on Android

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  console.log("LoginScreen rendered");

  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [googleLoading, setGoogleLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<FormErrors<LoginPayload>>({});
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const { setUser, setToken } = useAuthStore();

  //  Google OAuth setup
  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    //  Client ID
  });

  // useEffect that fires when Google returns a response

  const handleGoogleResponse = async () => {
    if (response?.type === "success") {
      // "success" = user approved and Google returned a token
      const { authentication } = response;

      console.log("Google OAuth success — sending token to backend");
      setGoogleLoading(true);

      try {
        const result = await api.post<AuthResponse>(
          "/api/v1/auth/google/token",
          {
            accessToken: authentication?.accessToken,
            // your backend uses this to verify with Google
            // and create/find the user in your database
          },
        );

        setUser(result.data.user);
        await setToken(result.data.token);
        console.log("Google login complete — navigating to tabs");
        router.replace("/(tabs)/index");
      } catch (error: any) {
        console.error("Google login error:", error.response?.data);
        Alert.alert("Google Sign-In Failed", "Please try again.");
      } finally {
        setGoogleLoading(false);
      }
    } else if (response?.type === "error") {
      console.error("Google OAuth error:", response.error);
    }
  };

  // call handleGoogleResponse whenever response changes
  useState(() => {
    handleGoogleResponse();
  });

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
    console.log("handleLogin called:", email);
    if (!validate()) return;

    setIsLoading(true);

    try {
      const response = await api.post<AuthResponse>("/api/v1/auth/signin", {
        email: email.trim().toLowerCase(),
        password,
      });

      console.log("Login success — userId:", response.data.user.id);

      setUser(response.data.user);
      await setToken(response.data.token);

      router.replace("/(tabs)/index");
    } catch (error: any) {
      console.log("Login error:", error?.message);
      console.log("Full error:", JSON.stringify(error, null, 2));
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
              // secureTextEntry controls visibility
              // false = visible, true = hidden (dots)
              // !showPassword flips it correctly:
              //   showPassword false → secureTextEntry true  → hidden
              //   showPassword true  → secureTextEntry false → visible
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
          className={`rounded-2xl py-4 items-center mb-4 ${
            isLoading ? "bg-red-900" : "bg-primary"
          }`}
          onPress={handleLogin}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Text className="text-white text-base font-bold">Sign In</Text>
          )}
        </TouchableOpacity>

        {/* Divider */}
        <View className="flex-row items-center mb-4">
          <View className="flex-1 h-px bg-border" />
          <Text className="text-muted text-xs px-3">or continue with</Text>
          <View className="flex-1 h-px bg-border" />
        </View>

        {/* Google sign in button */}
        <TouchableOpacity
          className={`rounded-2xl py-4 items-center mb-6 bg-card border border-border flex-row justify-center gap-3 ${
            googleLoading ? "opacity-50" : "opacity-100"
          }`}
          onPress={() => {
            console.log("Google sign-in tapped");
            promptAsync();
          }}
          disabled={!request || googleLoading}
          activeOpacity={0.8}
        >
          {googleLoading ? (
            <ActivityIndicator color="#64748b" size="small" />
          ) : (
            <>
              <Text className="text-2xl">G</Text>
              <Text className="text-white text-base font-semibold">
                Continue with Google
              </Text>
            </>
          )}
        </TouchableOpacity>

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
