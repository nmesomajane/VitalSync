import React from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";


type RhythmStatus = "regular" | "slightly_irregular" | "irregular";

interface RhythmBadgeProps {
  status: RhythmStatus;
  
  message: string;

  isLive?: boolean;

}


const STATUS_CONFIG = {
  regular: {
    label: "Normal Sinus Rhythm",
    iconName: "checkmark-circle" as const,
   
    color: "#10b981",
   
    backgroundColor: "#0d2a1a",
    borderColor: "#16653430",
  },
  slightly_irregular: {
    label: "Slightly Irregular",
    iconName: "warning" as const,
    color: "#f59e0b",

    backgroundColor: "#1a1400",
    borderColor: "#d9770630",
  },
  irregular: {
    label: "Irregular Rhythm",
    iconName: "alert-circle" as const,
    color: "#ef4444",
   
    backgroundColor: "#1c0a0a",
    borderColor: "#ef444430",
  },
};

export default function RhythmBadge({ status, message, isLive }: RhythmBadgeProps) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.regular;


  return (
    <View style={{
      backgroundColor: config.backgroundColor,
      borderRadius: 14,
      padding: 14,
      borderWidth: 1,
      borderColor: config.borderColor,
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 12,
      marginHorizontal: 16,
      marginBottom: 16,
    }}>

      {/* Status icon */}
      <View style={{
        width: 40, height: 40,
        borderRadius: 12,
        backgroundColor: `${config.color}15`,
       
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
       
      }}>
        <Ionicons
          name={config.iconName}
          size={22}
          color={config.color}
        />
      </View>

      {/* Text content */}
      <View style={{ flex: 1 }}>
        <View style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          marginBottom: 4,
        }}>
          <Text style={{
            fontSize: 13,
            fontWeight: "700",
            color: config.color,
          }}>
            {config.label}
          </Text>

          {/* LIVE dot — only shows during active streaming */}
          {isLive && (
            <View style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 4,
              backgroundColor: "#10b98115",
              paddingHorizontal: 6,
              paddingVertical: 2,
              borderRadius: 10,
            }}>
              <View style={{
                width: 5, height: 5,
                borderRadius: 2.5,
                backgroundColor: "#10b981",
              }} />
              <Text style={{
                fontSize: 9,
                fontWeight: "700",
                color: "#10b981",
                letterSpacing: 0.5,
              }}>
                LIVE
              </Text>
            </View>
          )}
        </View>

        <Text style={{
          fontSize: 12,
          color: "#9ca3af",
          lineHeight: 18,
        }}>
          {message}
        </Text>
      </View>
    </View>
  );
}