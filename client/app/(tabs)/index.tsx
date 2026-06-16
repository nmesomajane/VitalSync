import { View, Text } from "react-native";

import useAuthStore from "../../src/store/authStore";
import React from "react";

export default function DashboardScreen() {
  const { user } = useAuthStore();
  console.log("Dashboard rendered for:", user?.name);

  return (
    <View style={{
      flex: 1,
      backgroundColor: "#080c14",
      justifyContent: "center",
      alignItems: "center",
    }}>
      {/* View not div */}
      <Text style={{ fontSize: 32, marginBottom: 12 }}>❤️</Text>
      {/* Text not p or span */}
      <Text style={{ color: "#f1f5f9", fontSize: 20, fontWeight: "800" }}>
        Welcome, {user?.name ?? "Patient"}
      </Text>
      <Text style={{ color: "#64748b", fontSize: 13, marginTop: 6 }}>
        Dashboard coming next
      </Text>
    </View>
  );
}