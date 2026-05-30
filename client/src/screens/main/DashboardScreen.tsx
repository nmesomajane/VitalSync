import { View, Text } from "react-native";
import useAuthStore from "../../store/authStore";
import {JSX} from 'react'

export default function DashboardScreen(): JSX.Element {
  const { user } = useAuthStore();
  console.log("DashboardScreen rendered for:", user?.name);

  return (
    <View style={{
      flex: 1, backgroundColor: "#080c14",
      justifyContent: "center", alignItems: "center"
    }}>
      <Text style={{ fontSize: 32, marginBottom: 12 }}>❤️</Text>
      <Text style={{ color: "#f1f5f9", fontSize: 20, fontWeight: "800" }}>
        Welcome, {user?.name ?? "Patient"}
      </Text>
      <Text style={{ color: "#64748b", fontSize: 13, marginTop: 6 }}>
        Dashboard coming next
      </Text>
    </View>
  );
}