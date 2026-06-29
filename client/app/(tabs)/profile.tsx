import { View, Text } from "react-native";
import React from "react";
export default function ProfileScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: "#080c14", justifyContent: "center", alignItems: "center" }}>
      <Text style={{ fontSize: 32, marginBottom: 8 }}>👤</Text>
      <Text style={{ color: "#f1f5f9", fontSize: 16, fontWeight: "700" }}>Profile</Text>
      <Text style={{ color: "#64748b", fontSize: 12, marginTop: 4 }}>Coming Week 5</Text>
    </View>
  );
}