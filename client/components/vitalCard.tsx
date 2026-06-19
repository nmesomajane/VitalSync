import { View, Text, TouchableOpacity } from "react-native";
import React from "react";

// define exactly what data this component needs
interface VitalCardProps {
  icon: string;
  label: string;
  value: number | null;
  unit: string;
  color: string;
  status?: "Normal" | "High" | "Low" | "Critical";
  onPress?: () => void;
}

export default function VitalCard({
  icon, label, value, unit, color, status, onPress
}: VitalCardProps) {
  const getBgColor = () => {
    if (status === "Critical") return "#1a0808";
    if (status === "High" || status === "Low") return "#1a1000";
    return "#0f1923";
  };

  // determine border color
  const getBorderColor = () => {
    if (status === "Critical") return "#e9456060";
    if (status === "High" || status === "Low") return "#f9731660";
    return `${color}30`;
   
   
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      

      style={{
        backgroundColor: getBgColor(),
        borderWidth: 1,
        borderColor: getBorderColor(),
        borderRadius: 14,
        padding: 14,
        flex: 1,
        
      }}
    >
      {/* Top row — icon and status badge */}
      <View style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 10,
      }}>
        <Text style={{ fontSize: 22 }}>{icon}</Text>

        {status && (
         
          <View style={{
            backgroundColor: status === "Normal" ? "#0d2a1a" : "#1a1000",
            paddingHorizontal: 7,
            paddingVertical: 2,
            borderRadius: 4,
          }}>
            <Text style={{
              fontSize: 9,
              fontWeight: "700",
              color: status === "Normal" ? "#4ade80"
                : status === "Critical" ? "#e94560"
                : "#fbbf24",
             
              letterSpacing: 0.5,
            }}>
              {status}
            </Text>
          </View>
        )}
      </View>

      {/* Label */}
      <Text style={{
        fontSize: 9,
        color: "#64748b",
        letterSpacing: 1,
        textTransform: "uppercase",
        marginBottom: 4,
      }}>
        {label}
      </Text>

      {/* Value and unit */}
      <View style={{ flexDirection: "row", alignItems: "baseline", gap: 3 }}>
        <Text style={{
          fontSize: 26,
          fontWeight: "800",
          color: value !== null ? color : "#334155",
         
          lineHeight: 32,
        }}>
          {value !== null ? value : "--"}
        
        </Text>
        <Text style={{ fontSize: 11, color: "#475569" }}>{unit}</Text>
      </View>
    </TouchableOpacity>
  );
}