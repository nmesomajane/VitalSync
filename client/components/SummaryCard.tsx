import React from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../constants/colors";

interface SummaryCardProps {
  icon: string;
  label: string;
  value: string;
  unit?: string;
  color: string;
  highlight?: boolean;

}

export default function SummaryCard({
  icon, label, value, unit, color, highlight = false,
}: SummaryCardProps) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: highlight ? "#1a1000" : Colors.card,
        borderRadius: 14,
        padding: 14,
        borderWidth: 1,
        borderColor: highlight
          ? `${Colors.warning}30`
          : Colors.cardBorder,
        gap: 8,
      }}
    >
      {/* Icon in colored circle */}
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: 9,
          backgroundColor: `${color}15`,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name={icon as any} size={16} color={color} />
      </View>

      {/* Label */}
      <Text
        style={{
          fontSize: 10,
          color: Colors.textMuted,
          letterSpacing: 0.5,
          textTransform: "uppercase",
          fontWeight: "600",
        }}
      >
        {label}
      </Text>

      {/* Value and unit */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "baseline",
          gap: 3,
          flexWrap: "wrap",
        }}
      >
        <Text
          style={{
            fontSize: 20,
            fontWeight: "800",
            color: highlight ? Colors.warning : Colors.textPrimary,
          }}
        >
          {value}
        </Text>
        {unit && (
          <Text style={{ fontSize: 11, color: Colors.textMuted }}>
            {unit}
          </Text>
        )}
      </View>
    </View>
  );
}