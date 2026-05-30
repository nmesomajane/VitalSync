import { useState,JSX } from "react";
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
import { StackNavigationProp } from "@react-navigation/stack";
import api from "../../services/api";
import useAuthStore from "../../store/authStore";
import {
  RootStackParamList,
  LoginPayload,
  AuthResponse,
  FormErrors,
} from "../../types";


// define the navigation prop type for this screen
// tells TypeScript this screen is part of RootStackParamList
type LoginScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "Login"
>;

interface Props {
  navigation: LoginScreenNavigationProp;
  // interface Props defines what this component receives
  // navigation is the only prop React Navigation passes to screens
}

export default function LoginScreen({ navigation }: Props): JSX.Element {
  console.log("LoginScreen rendered");

  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<FormErrors<LoginPayload>>({});
  // FormErrors<LoginPayload> = { email?: string, password?: string }
  // TypeScript enforces only these two keys are allowed as error fields

  const { setUser, setToken } = useAuthStore();

  // ── validation ──────────────────────────────────────────────
  const validate = (): boolean => {
    // : boolean means this function must return true or false
    const newErrors: FormErrors<LoginPayload> = {};

    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Please enter a valid email";
    }

    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    console.log("Login validation errors:", newErrors);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ── login handler ───────────────────────────────────────────
  const handleLogin = async (): Promise<void> => {
    console.log("handleLogin called:", email);

    if (!validate()) return;

    setIsLoading(true);

    try {
      console.log("Sending POST /api/v1/auth/signin");

      const response = await api.post<AuthResponse>("/api/v1/auth/signin", {
        // api.post<AuthResponse> tells TypeScript the response shape
        // response.data is now typed as AuthResponse automatically
        email: email.trim().toLowerCase(),
        password,
      });

      console.log("Login success:", {
        userId: response.data.user.id,
        hasToken: !!response.data.token,
      });

      setUser(response.data.user);
      await setToken(response.data.token);

      // AppNavigator switches to MainTabs automatically
    } catch (error: any) {
      // error: any because Axios errors are complex objects
      // in TypeScript, catch errors are typed as 'unknown' by default
      console.error("Login error:", {
        status: error.response?.status,
        message: error.response?.data?.message,
      });

      Alert.alert(
        "Login Failed",
        error.response?.data?.message ?? "Check your connection and try again.",
        [{ text: "OK" }],
        // ?? is nullish coalescing — uses right side if left is null/undefined
      );
    } finally {
      setIsLoading(false);
    }
  };

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
        {/* Header */}
        <View style={{ alignItems: "center", marginTop: 80, marginBottom: 48 }}>
          <Text style={{ fontSize: 40, marginBottom: 12 }}>❤️</Text>
          <Text
            style={{
              fontSize: 28,
              fontWeight: "800",
              color: "#f1f5f9",
              letterSpacing: -0.5,
            }}
          >
            VitalSync
          </Text>
          <Text style={{ fontSize: 14, color: "#64748b", marginTop: 6 }}>
            Monitor your health in real time
          </Text>
        </View>

        {/* Email */}
        <View style={{ marginBottom: 16 }}>
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
            Email
          </Text>
          <TextInput
            style={{
              backgroundColor: "#0f1923",
              borderWidth: 1,
              borderColor: errors.email ? "#e94560" : "#1e293b",
              borderRadius: 12,
              padding: 14,
              fontSize: 15,
              color: "#f1f5f9",
            }}
            placeholder="your@email.com"
            placeholderTextColor="#475569"
            value={email}
            onChangeText={(text: string) => {
              setEmail(text);
              if (errors.email)
                setErrors((prev) => ({ ...prev, email: undefined }));
              // undefined removes the key entirely
              // null would keep the key with a null value
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {errors.email && (
            <Text style={{ color: "#e94560", fontSize: 12, marginTop: 5 }}>
              {errors.email}
            </Text>
          )}
        </View>

        {/* Password */}
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
          <TextInput
            style={{
              backgroundColor: "#0f1923",
              borderWidth: 1,
              borderColor: errors.password ? "#e94560" : "#1e293b",
              borderRadius: 12,
              padding: 14,
              fontSize: 15,
              color: "#f1f5f9",
            }}
            placeholder="••••••••"
            placeholderTextColor="#475569"
            value={password}
            onChangeText={(text: string) => {
              setPassword(text);
              if (errors.password)
                setErrors((prev) => ({ ...prev, password: undefined }));
            }}
            secureTextEntry={true}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {errors.password && (
            <Text style={{ color: "#e94560", fontSize: 12, marginTop: 5 }}>
              {errors.password}
            </Text>
          )}
        </View>

        {/* Login button */}
        <TouchableOpacity
          style={{
            backgroundColor: isLoading ? "#7f1d35" : "#e94560",
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
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Text style={{ color: "white", fontSize: 16, fontWeight: "700" }}>
              Sign In
            </Text>
          )}
        </TouchableOpacity>

        {/* Go to signup */}
        <TouchableOpacity
          style={{ alignItems: "center", padding: 12 }}
          onPress={() => {
            console.log("Navigating to Signup");
            navigation.navigate("Signup");
          }}
        >
          <Text style={{ color: "#64748b", fontSize: 14 }}>
            Dont have an account?{" "}
            <Text style={{ color: "#4f8ef7", fontWeight: "700" }}>
              Create one
            </Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
