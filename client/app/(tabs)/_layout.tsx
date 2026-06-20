import { Tabs } from "expo-router";
import { View, Text } from "react-native";
import useVitalsStore from "../../src/store/vitalsStore";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "../../constants/colors";

type IoniconName =
  | "home"
  | "home-outline"
  | "pulse"
  | "pulse-outline"
  | "bar-chart"
  | "bar-chart-outline"
  | "sparkles"
  | "sparkles-outline"
  | "person"
  | "person-outline";

interface TabIconProps {
  name: IoniconName;
  focused: boolean;
  color: string;
  size: number;
  badgeCount: number;
}

function TabIcon({ name, focused, color, size, badgeCount }: TabIconProps) {
  return (
     <View style={{ alignItems: "center", justifyContent: "center" }}>
      <Ionicons
        name={focused ? name : `${name}-outline` as IoniconName}
        // when focused: filled icon (e.g. "home")
        // when not focused: outline icon (e.g. "home-outline")
        // this is a standard iOS/Android pattern
        size={size}
        color={color}
      />
     {badgeCount !== undefined && badgeCount > 0 && (
        <View style={{
          position: "absolute",
          top: -4,
          right: -10,
          backgroundColor: Colors.danger,
          borderRadius: 8,
          minWidth: 16,
          height: 16,
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 3,
        }}>
          <Text style={{ color: "white", fontSize: 9, fontWeight: "700" }}>
            {badgeCount > 9 ? "9+" : badgeCount}
          </Text>
        </View>
      )}
    </View>
  );
}

export default function TabsLayout() {
  const { unreadAlertCount } = useVitalsStore();
   const insets = useSafeAreaInsets();

  console.log("TabsLayout rendered — unread alerts:", unreadAlertCount);

  return (
    <Tabs
      screenOptions={{
         headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.card,
          borderTopColor: Colors.cardBorder,
          borderTopWidth: 1,
          height: 56 + insets.bottom,
          
          paddingBottom: insets.bottom + 4,
          
          paddingTop: 8,
          elevation: 0,
        
          shadowOpacity: 0,
         
        },

         tabBarActiveTintColor: Colors.primary,
        // blue for selected tab
        tabBarInactiveTintColor: Colors.textMuted,
        // grey for unselected tabs
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "600",
          letterSpacing: 0.2,
          marginTop: 2,
        },
      }}
    >
      {/* Tab 1 — Dashboard (Home) */}
      <Tabs.Screen
        name="index"
        options={{
          tabBarLabel: "Home",
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon name="home" focused={focused} color={color} size={size} badgeCount={0} />
          ),
        }}
      />
      
      {/* Tab 2 — ECG */}
      <Tabs.Screen
        name="ecg"
        options={{
          tabBarLabel: "ECG",
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon name="pulse" focused={focused} color={color} size={size} badgeCount={0} />
          ),
        }}
      />

      {/* Tab 3 — History */}
       <Tabs.Screen
        name="history"
        options={{
          tabBarLabel: "History",
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon
              name="bar-chart"
              focused={focused}
              color={color}
              size={size}
              badgeCount={unreadAlertCount}
            />
          ),
        }}
      />

      {/* Tab 4 — AI */}
       <Tabs.Screen
        name="ai"
        options={{
          tabBarLabel: "AI",
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon name="sparkles" focused={focused} color={color} size={size} badgeCount={0}/>
          ),
        }}
      />

      {/* Tab 5 — Profile */}
     <Tabs.Screen
        name="profile"
        options={{
          tabBarLabel: "Profile",
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon name="person" focused={focused} color={color} size={size} badgeCount={0} />
          ),
        }}
      />
    </Tabs>
  );
}
