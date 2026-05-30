import { useEffect , JSX} from "react";
import { View, ActivityIndicator } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import * as SecureStore from "expo-secure-store";

import LoginScreen from "../screens/auth/LoginScreen";
import SignupScreen from "../screens/auth/SignupScreen";
import DashboardScreen from "../screens/main/DashboardScreen";
import useAuthStore from "../store/authStore";
import { RootStackParamList, MainTabParamList } from "../types";

// pass your type to createStackNavigator
// TypeScript now knows exactly which screens exist
// and what parameters they accept
const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

// ── Loading ───────────────────────────────────────────────────
function LoadingScreen(): JSX.Element {
  // JSX.Element is the return type of any React component
  return (
    <View style={{
      flex: 1, justifyContent: "center",
      alignItems: "center", backgroundColor: "#080c14"
    }}>
      <ActivityIndicator size="large" color="#e94560" />
    </View>
  );
}

// ── Main Tabs ─────────────────────────────────────────────────
function MainTabs(): JSX.Element {
  console.log("MainTabs rendered — user authenticated");
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#080c14",
          borderTopColor: "#1e293b",
          paddingBottom: 8,
          paddingTop: 6,
          height: 60,
        },
        tabBarActiveTintColor: "#e94560",
        tabBarInactiveTintColor: "#475569",
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "600",
        },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ tabBarLabel: "Home" }}
      />
      {/* ECG, History, AI, Profile added later */}
    </Tab.Navigator>
  );
}

// ── Auth Stack ────────────────────────────────────────────────
function AuthStack(): JSX.Element {
  console.log("AuthStack rendered — user not authenticated");
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
    </Stack.Navigator>
  );
}

// ── Root Navigator ────────────────────────────────────────────
export default function AppNavigator(): JSX.Element {
  const { token, isLoading, setToken, setLoading } = useAuthStore();

  useEffect(() => {
    const checkStoredToken = async (): Promise<void> => {
      // : Promise<void> = this async function returns nothing
      console.log("AppNavigator: checking SecureStore for token");
      setLoading(true);

      try {
        const storedToken = await SecureStore.getItemAsync("vitalsync_token");

        if (storedToken) {
          console.log("AppNavigator: token found — restoring session");
          await setToken(storedToken);
        } else {
          console.log("AppNavigator: no token — showing login");
        }
      } catch (error) {
        console.error("AppNavigator: error reading token:", error);
      } finally {
        setLoading(false);
      }
    };

    checkStoredToken();
  }, []);

  if (isLoading) {
    console.log("AppNavigator: showing loading screen");
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      {token ? <MainTabs /> : <AuthStack />}
    </NavigationContainer>
  );
}