import { useState, useCallback } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  ActivityIndicator, KeyboardAvoidingView,
  Platform, ScrollView, Alert,
} from "react-native";
import { router } from "expo-router";
import api from "../../src/services/api";
import useAuthStore from "../../src/store/authStore";
import { AuthResponse, FormErrors } from "../../src/types";
import React from "react";

interface FormState {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  age: string;
  gender: "male" | "female" | "other" | "";
}

// ── Field component OUTSIDE SignupScreen ──────────────────────
// this is the critical fix — defined outside means it's created
// ONCE when the file loads, not on every keystroke
// React can now reuse the same component instance between renders
// and the keyboard stays open

interface FieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  error?: string;
  keyboard?: "default" | "email-address" | "numeric";
  secure?: boolean;
  caps?: "none" | "words" | "sentences" | "characters";
}

const Field = ({
  label, value, onChangeText, placeholder,
  error, keyboard = "default",
  secure = false, caps = "words",
}: FieldProps) => (
  // notice: no access to "form" state or "errors" directly
  // everything it needs is passed as props from SignupScreen
  // this makes it a pure presentational component
  <View style={{ marginBottom: 16 }}>
    <Text style={{
      fontSize: 11, fontWeight: "700", color: "#64748b",
      letterSpacing: 1, marginBottom: 8, textTransform: "uppercase",
    }}>
      {label}
    </Text>
    <TextInput
      style={{
        backgroundColor: "#0f1923",
        borderWidth: 1,
        borderColor: error ? "#e94560" : "#1e293b",
        borderRadius: 12,
        padding: 14,
        fontSize: 15,
        color: "#f1f5f9",
      }}
      placeholder={placeholder}
      placeholderTextColor="#475569"
      value={value}
      onChangeText={onChangeText}
      keyboardType={keyboard}
      secureTextEntry={secure}
      autoCapitalize={caps}
      autoCorrect={false}
    />
    {error && (
      <Text style={{ color: "#e94560", fontSize: 12, marginTop: 5 }}>
        {error}
      </Text>
    )}
  </View>
);

// ── SignupScreen ──────────────────────────────────────────────
export default function SignupScreen() {
  console.log("SignupScreen rendered");

  const [form, setForm] = useState<FormState>({
    name: "", email: "", password: "",
    confirmPassword: "", age: "", gender: "",
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<FormErrors<FormState>>({});
  const { setUser, setToken } = useAuthStore();

  // useCallback prevents updateField from being recreated on every render
  // without useCallback, a new function reference is created each render
  // which could still cause subtle re-render issues
  const updateField = useCallback(<K extends keyof FormState>(
    field: K,
    value: FormState[K]
  ) => {
    console.log(`Field "${field}" updated:`, value);
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  }, [errors]);

  const validate = (): boolean => {
    const e: FormErrors<FormState> = {};
    if (!form.name.trim() || form.name.trim().length < 2)
      e.name = "Name must be at least 2 characters";
    if (!form.email.trim())
      e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = "Invalid email format";
    if (!form.password)
      e.password = "Password is required";
    else if (form.password.length < 6)
      e.password = "Minimum 6 characters";
    if (form.password !== form.confirmPassword)
      e.confirmPassword = "Passwords do not match";
    if (form.age && isNaN(Number(form.age)))
      e.age = "Enter a valid age";
    console.log("Signup validation:", e);
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSignup = async (): Promise<void> => {
    console.log("handleSignup called:", form.email);
    if (!validate()) return;
    setIsLoading(true);

    try {
      const response = await api.post<AuthResponse>("/api/v1/auth/signup", {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        ...(form.age && { age: parseInt(form.age, 10) }),
        ...(form.gender && { gender: form.gender }),
      });

      console.log("Signup success:", response.data.user.id);
      setUser(response.data.user);
      await setToken(response.data.token);

      console.log("Navigating to tabs");
      router.replace("/(tabs)");

    } catch (error: any) {
      console.error("Signup error:", error.response?.data ?? error.message);

      if (!error.response) {
        Alert.alert(
          "Connection Failed",
          "Cannot reach server. Check your WiFi and API_URL.",
          [{ text: "OK" }]
        );
      } else {
        Alert.alert(
          "Signup Failed",
          error.response?.data?.message ?? "Something went wrong.",
          [{ text: "OK" }]
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const genders: Array<"male" | "female" | "other"> = ["male", "female", "other"];

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#080c14" }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, padding: 24 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Back */}
        <TouchableOpacity
          style={{ marginTop: 52, marginBottom: 32, alignSelf: "flex-start" }}
          onPress={() => router.back()}
        >
          <Text style={{ color: "#64748b", fontSize: 14 }}>← Back to login</Text>
        </TouchableOpacity>

        {/* Header */}
        <View style={{ marginBottom: 32 }}>
          <Text style={{ fontSize: 26, fontWeight: "800", color: "#f1f5f9" }}>
            Create account
          </Text>
          <Text style={{ fontSize: 14, color: "#64748b", marginTop: 6 }}>
            Start monitoring your health today
          </Text>
        </View>

        {/* Fields — now passing value and onChangeText as props */}
        <Field
          label="Full Name"
          value={form.name}
          onChangeText={(t) => updateField("name", t)}
          placeholder="Nmesoma"
          error={errors.name}
        />
        <Field
          label="Email"
          value={form.email}
          onChangeText={(t) => updateField("email", t)}
          placeholder="nmesoma@email.com"
          keyboard="email-address"
          caps="none"
          error={errors.email}
        />
        <Field
          label="Password"
          value={form.password}
          onChangeText={(t) => updateField("password", t)}
          placeholder="••••••••"
          secure
          caps="none"
          error={errors.password}
        />
        <Field
          label="Confirm Password"
          value={form.confirmPassword}
          onChangeText={(t) => updateField("confirmPassword", t)}
          placeholder="••••••••"
          secure
          caps="none"
          error={errors.confirmPassword}
        />
        <Field
          label="Age (optional)"
          value={form.age}
          onChangeText={(t) => updateField("age", t)}
          placeholder="22"
          keyboard="numeric"
          caps="none"
          error={errors.age}
        />

        {/* Gender */}
        <View style={{ marginBottom: 32 }}>
          <Text style={{
            fontSize: 11, fontWeight: "700", color: "#64748b",
            letterSpacing: 1, marginBottom: 8, textTransform: "uppercase",
          }}>
            Gender (optional)
          </Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {genders.map((g) => (
              <TouchableOpacity
                key={g}
                onPress={() => updateField("gender", g)}
                style={{
                  flex: 1, padding: 12, borderRadius: 10,
                  alignItems: "center",
                  backgroundColor: form.gender === g ? "#e9456020" : "#0f1923",
                  borderWidth: 1,
                  borderColor: form.gender === g ? "#e94560" : "#1e293b",
                }}
              >
                <Text style={{
                  color: form.gender === g ? "#e94560" : "#64748b",
                  fontSize: 12, fontWeight: "600", textTransform: "capitalize",
                }}>
                  {g}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={{
            backgroundColor: isLoading ? "#7f1d35" : "#e94560",
            borderRadius: 14, padding: 16,
            alignItems: "center", marginBottom: 16,
          }}
          onPress={handleSignup}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Text style={{ color: "white", fontSize: 16, fontWeight: "700" }}>
              Create Account
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={{ alignItems: "center", padding: 12, marginBottom: 32 }}
          onPress={() => router.push("/(auth)/login")}
        >
          <Text style={{ color: "#64748b", fontSize: 14 }}>
            Already have an account?{" "}
            <Text style={{ color: "#4f8ef7", fontWeight: "700" }}>Sign in</Text>
          </Text>
        </TouchableOpacity>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}