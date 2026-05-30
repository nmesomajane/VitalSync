import { useState,JSX } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  ActivityIndicator, KeyboardAvoidingView,
  Platform, ScrollView, Alert,
} from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import api from "../../services/api";
import useAuthStore from "../../store/authStore";
import {
  RootStackParamList, SignupPayload,
  AuthResponse, FormErrors, User,
} from "../../types";

type SignupScreenNavigationProp = StackNavigationProp<RootStackParamList, "Signup">;

interface Props {
  navigation: SignupScreenNavigationProp;
}

// the form has more fields than SignupPayload because of confirmPassword
// so we define a separate FormState type
interface FormState {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  age: string;
  // string because TextInput always returns strings
  // we convert to number before sending to API
  gender: "male" | "female" | "other" | "";
  // "" = nothing selected yet
}

export default function SignupScreen({ navigation }: Props): JSX.Element {
  console.log("SignupScreen rendered");

  const [form, setForm] = useState<FormState>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    age: "",
    gender: "",
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<FormErrors<FormState>>({});
  const { setUser, setToken } = useAuthStore();

  // ── update one field ────────────────────────────────────────
  const updateField = <K extends keyof FormState>(
    field: K,
    value: FormState[K]
  ): void => {
    // <K extends keyof FormState> = generic constrained to FormState keys
    // this ensures field must be a valid FormState key
    // and value must match the type of that field
    console.log(`Field "${field}" updated:`, value);
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  // ── validation ──────────────────────────────────────────────
  const validate = (): boolean => {
    const newErrors: FormErrors<FormState> = {};

    if (!form.name.trim() || form.name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    }
    if (!form.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = "Please enter a valid email";
    }
    if (!form.password) {
      newErrors.password = "Password is required";
    } else if (form.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }
    if (form.age && (isNaN(Number(form.age)) || Number(form.age) < 1)) {
      newErrors.age = "Please enter a valid age";
    }

    console.log("Signup validation errors:", newErrors);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ── signup handler ──────────────────────────────────────────
  const handleSignup = async (): Promise<void> => {
    console.log("handleSignup called:", form.email);

    if (!validate()) return;

    setIsLoading(true);

    try {
      const payload: SignupPayload = {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        ...(form.age && { age: parseInt(form.age, 10) }),
        // spread only if age is not empty
        // parseInt(form.age, 10) — 10 is the radix (base 10 number system)
        ...(form.gender && { gender: form.gender }),
      };

      console.log("Sending POST /api/v1/auth/signup");

      const response = await api.post<AuthResponse>("/api/v1/auth/signup", payload);

      console.log("Signup success:", response.data.user.id);

      setUser(response.data.user);
      await setToken(response.data.token);

    } catch (error: any) {
      console.error("Signup error:", {
        status: error.response?.status,
        message: error.response?.data?.message,
      });

      Alert.alert(
        "Signup Failed",
        error.response?.data?.message ?? "Something went wrong. Try again.",
        [{ text: "OK" }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  // ── reusable typed input ────────────────────────────────────
  interface InputFieldProps {
    label: string;
    field: keyof FormState;
    placeholder: string;
    keyboardType?: "default" | "email-address" | "numeric";
    secureEntry?: boolean;
    autoCapitalize?: "none" | "words" | "sentences" | "characters";
  }

  const InputField = ({
    label, field, placeholder,
    keyboardType = "default",
    secureEntry = false,
    autoCapitalize = "words",
  }: InputFieldProps): JSX.Element => (
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
          borderColor: errors[field] ? "#e94560" : "#1e293b",
          borderRadius: 12,
          padding: 14,
          fontSize: 15,
          color: "#f1f5f9",
        }}
        placeholder={placeholder}
        placeholderTextColor="#475569"
        value={String(form[field])}
        onChangeText={(text: string) =>
          updateField(field, text as FormState[typeof field])
        }
        keyboardType={keyboardType}
        secureTextEntry={secureEntry}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
      />
      {errors[field] && (
        <Text style={{ color: "#e94560", fontSize: 12, marginTop: 5 }}>
          {errors[field]}
        </Text>
      )}
    </View>
  );

  const genderOptions: Array<"male" | "female" | "other"> = ["male", "female", "other"];

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
          onPress={() => {
            console.log("Going back to Login");
            navigation.goBack();
          }}
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

        <InputField label="Full Name" field="name" placeholder="Nmesoma" />
        <InputField
          label="Email" field="email"
          placeholder="nmesoma@email.com"
          keyboardType="email-address" autoCapitalize="none"
        />
        <InputField
          label="Password" field="password"
          placeholder="••••••••"
          secureEntry={true} autoCapitalize="none"
        />
        <InputField
          label="Confirm Password" field="confirmPassword"
          placeholder="••••••••"
          secureEntry={true} autoCapitalize="none"
        />
        <InputField
          label="Age (optional)" field="age"
          placeholder="22" keyboardType="numeric"
          autoCapitalize="none"
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
            {genderOptions.map((option) => (
              <TouchableOpacity
                key={option}
                onPress={() => {
                  console.log("Gender selected:", option);
                  updateField("gender", option);
                }}
                style={{
                  flex: 1, padding: 12, borderRadius: 10,
                  alignItems: "center",
                  backgroundColor: form.gender === option ? "#e9456020" : "#0f1923",
                  borderWidth: 1,
                  borderColor: form.gender === option ? "#e94560" : "#1e293b",
                }}
              >
                <Text style={{
                  color: form.gender === option ? "#e94560" : "#64748b",
                  fontSize: 12, fontWeight: "600", textTransform: "capitalize",
                }}>
                  {option}
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
          onPress={() => navigation.navigate("Login")}
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