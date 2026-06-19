import { Tabs } from "expo-router";
import { View, Text } from "react-native";
import useVitalsStore from "../../src/store/vitalsStore";
import React from "react";



interface TabIconProps {
  emoji: string;
  focused: boolean;

}

function TabIcon({ emoji, focused }: TabIconProps) {
  return (
    <View style={{ alignItems: "center", justifyContent: "center" }}>
      <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>
        {emoji}
       
      </Text>
    </View>
  );
}

export default function TabsLayout() {
  const { unreadAlertCount } = useVitalsStore();


  console.log("TabsLayout rendered — unread alerts:", unreadAlertCount);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#080c14",
          borderTopColor: "#1e293b",
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
        },

        tabBarActiveTintColor: "#e94560",
        tabBarInactiveTintColor: "#475569",
        // color when tab is not selected

        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "600",
          letterSpacing: 0.3,
        },
      }}
    >

      {/* Tab 1 — Dashboard (Home) */}
      <Tabs.Screen
        name="index"
       
        options={{
          tabBarLabel: "Home",
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="🏠" focused={focused} />
            
          ),
        }}
      />

      {/* Tab 2 — ECG */}
      <Tabs.Screen
        name="ecg"
       
        options={{
          tabBarLabel: "ECG",
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="📈" focused={focused} />
          ),
        }}
      />

      {/* Tab 3 — History */}
      <Tabs.Screen
        name="history"
        options={{
          tabBarLabel: "History",
          tabBarIcon: ({ focused }) => (
            <View>
              <TabIcon emoji="📅" focused={focused} />
              {unreadAlertCount > 0 && (
               
                <View style={{
                  position: "absolute",
                  top: -4,
                  right: -8,
                  backgroundColor: "#e94560",
                  borderRadius: 8,
                  minWidth: 16,
                  height: 16,
                  alignItems: "center",
                  justifyContent: "center",
                  paddingHorizontal: 3,
                }}>
                  <Text style={{ color: "white", fontSize: 9, fontWeight: "700" }}>
                    {unreadAlertCount > 9 ? "9+" : unreadAlertCount}
                  
                  </Text>
                </View>
              )}
            </View>
          ),
        }}
      />

      {/* Tab 4 — AI */}
      <Tabs.Screen
        name="ai"
        options={{
          tabBarLabel: "AI",
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="🤖" focused={focused} />
          ),
        }}
      />

      {/* Tab 5 — Profile */}
      <Tabs.Screen
        name="profile"
        options={{
          tabBarLabel: "Profile",
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="👤" focused={focused} />
          ),
        }}
      />

    </Tabs>
  );
}