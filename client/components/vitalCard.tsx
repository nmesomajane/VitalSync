import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Colors } from "../constants/colors";
import React from "react";

// define exactly what data this component needs
interface VitalCardProps {
  iconName: string;
  // the icon name from the library e.g. "heart" or "lungs"
  iconSet?: string;
  label: string;
  value: number | null;
  unit: string;
  color: string;
  status?: "Normal" | "High" | "Low" | "Critical";
  onPress?: () => void;
}

export default function VitalCard({
 iconName, iconSet = "ionicons", label, value, unit, color, status, onPress
}: VitalCardProps) {
   const getBgColor = (): string => {
    if (!status || status === "Normal") return Colors.card;
    if (status === "Critical") return "#1c0a0a";
    return "#1a1400";
  };

  // determine border color
 const getBorderColor = (): string => {
    if (!status || status === "Normal") return Colors.cardBorder;
    if (status === "Critical") return `${Colors.danger}50`;
    return `${Colors.warning}50`;
  };

    const getStatusColor = (): string => {
    if (status === "Normal") return Colors.success;
    if (status === "Critical") return Colors.danger;
    return Colors.warning;
  };

   const renderIcon = () => {
    const iconSize = 22;

    if (iconSet === "material") {
      return (
        <MaterialCommunityIcons
          name={iconName as any}
          size={iconSize}
          color={color}
         
        />
      );
    }
    return (
      <Ionicons
        name={iconName as any}
        size={iconSize}
        color={color}
      />
    );
  };


    return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      style={{
        backgroundColor: getBgColor(),
        borderWidth: 1,
        borderColor: getBorderColor(),
        borderRadius: 16,
        padding: 16,
        flex: 1,
      }}
    >
      {/* Top row */}
      <View style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12,
      }}>
        {/* Icon in a colored circle */}
        <View style={{
          width: 36, height: 36,
          borderRadius: 10,
          backgroundColor: `${color}15`,
          // color + 15 hex = very transparent background
          // e.g. red icon on very faint red background
          alignItems: "center",
          justifyContent: "center",
        }}>
          {renderIcon()}
        </View>

        {/* Status badge */}
        {status && (
          <View style={{
            backgroundColor: `${getStatusColor()}15`,
            paddingHorizontal: 8,
            paddingVertical: 3,
            borderRadius: 6,
            borderWidth: 1,
            borderColor: `${getStatusColor()}30`,
          }}>
            <Text style={{
              fontSize: 9,
              fontWeight: "700",
              color: getStatusColor(),
              letterSpacing: 0.5,
            }}>
              {status.toUpperCase()}
            </Text>
          </View>
        )}
      </View>

      {/* Label */}
      <Text style={{
        fontSize: 10,
        color: Colors.textMuted,
        letterSpacing: 0.8,
        textTransform: "uppercase",
        marginBottom: 6,
        fontWeight: "600",
      }}>
        {label}
      </Text>

      {/* Value */}
      <View style={{ flexDirection: "row", alignItems: "baseline", gap: 3 }}>
        <Text style={{
          fontSize: 28,
          fontWeight: "800",
          color: value !== null ? color : Colors.textMuted,
          lineHeight: 34,
        }}>
          {value !== null ? value : "--"}
        </Text>
        <Text style={{ fontSize: 12, color: Colors.textMuted, fontWeight: "500" }}>
          {unit}
        </Text>
      </View>
    </TouchableOpacity>
  );
}