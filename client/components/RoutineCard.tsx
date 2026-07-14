import React from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ParsedSuggestions } from "../hooks/useAI";
import { Colors } from "../constants/colors";

interface RoutineCardProps {
  routine: ParsedSuggestions["routine"];
  warnings: string[];
}

const ROUTINE_ITEMS = [
  {
    key: "morning" as const,
    label: "Morning",
    icon: "partly-sunny-outline" as const,
    time: "6:00 – 10:00 AM",
    color: "#f59e0b",
  },
  {
    key: "afternoon" as const,
    label: "Afternoon",
    icon: "sunny-outline" as const,
    time: "12:00 – 5:00 PM",
    color: "#f97316",
  },
  {
    key: "evening" as const,
    label: "Evening",
    icon: "cloudy-night-outline" as const,
    time: "5:00 – 9:00 PM",
    color: "#8b5cf6",
  },
  {
    key: "sleep" as const,
    label: "Sleep",
    icon: "moon-outline" as const,
    time: "9:00 PM onwards",
    color: "#3b82f6",
  },
];

export default function RoutineCard({ routine, warnings }: RoutineCardProps) {
  return (
    <>
      {/* Daily Routine Card */}
      <View
        style={{
          marginHorizontal: 16,
          marginBottom: 16,
          backgroundColor: Colors.card,
          borderRadius: 18,
          padding: 16,
          borderWidth: 1,
          borderColor: Colors.cardBorder,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            marginBottom: 16,
          }}
        >
          <Ionicons
            name="calendar-outline"
            size={18}
            color={Colors.primary}
          />
          <Text
            style={{
              fontSize: 15,
              fontWeight: "700",
              color: Colors.textPrimary,
            }}
          >
            Daily Routine
          </Text>
        </View>

        {ROUTINE_ITEMS.map((item, index) => (
          <View
            key={item.key}
            style={{
              flexDirection: "row",
              gap: 12,
              alignItems: "flex-start",
              paddingBottom: index < ROUTINE_ITEMS.length - 1 ? 14 : 0,
              marginBottom: index < ROUTINE_ITEMS.length - 1 ? 14 : 0,
              borderBottomWidth:
                index < ROUTINE_ITEMS.length - 1 ? 1 : 0,
              borderBottomColor: Colors.cardBorder,
            }}
          >
            {/* Timeline dot + connector */}
            <View style={{ alignItems: "center", width: 36 }}>
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  backgroundColor: `${item.color}15`,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name={item.icon} size={18} color={item.color} />
              </View>
              {index < ROUTINE_ITEMS.length - 1 && (
                <View
                  style={{
                    width: 1,
                    height: 14,
                    backgroundColor: Colors.cardBorder,
                    marginTop: 4,
                  
                  }}
                />
              )}
            </View>

            <View style={{ flex: 1, paddingTop: 2 }}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  marginBottom: 4,
                }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "700",
                    color: Colors.textPrimary,
                  }}
                >
                  {item.label}
                </Text>
                <Text
                  style={{
                    fontSize: 10,
                    color: Colors.textMuted,
                  }}
                >
                  {item.time}
                </Text>
              </View>
              <Text
                style={{
                  fontSize: 13,
                  color: Colors.textSecondary,
                  lineHeight: 19,
                }}
              >
                {routine[item.key]}
              </Text>
            </View>
          </View>
        ))}
      </View>

      {/* Warning Signs Card — only shown if warnings exist */}
      {warnings.length > 0 && (
        <View
          style={{
            marginHorizontal: 16,
            marginBottom: 16,
            backgroundColor: "#1c0a0a",
            borderRadius: 18,
            padding: 16,
            borderWidth: 1,
            borderColor: `${Colors.danger}30`,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              marginBottom: 12,
            }}
          >
            <Ionicons
              name="warning-outline"
              size={18}
              color={Colors.danger}
            />
            <Text
              style={{
                fontSize: 14,
                fontWeight: "700",
                color: Colors.danger,
              }}
            >
              Watch For These Signs
            </Text>
          </View>

          <Text
            style={{
              fontSize: 11,
              color: Colors.textMuted,
              marginBottom: 12,
              lineHeight: 16,
            }}
          >
            Consult a doctor immediately if you experience any of the following:
          </Text>

          {warnings.map((warning, index) => (
            <View
              key={index}
              style={{
                flexDirection: "row",
                gap: 10,
                alignItems: "flex-start",
                marginBottom: index < warnings.length - 1 ? 10 : 0,
              }}
            >
              <Ionicons
                name="alert-circle"
                size={14}
                color={Colors.danger}
                style={{ marginTop: 3 }}
              />
              <Text
                style={{
                  fontSize: 13,
                  color: "#fca5a5",
                  
                  flex: 1,
                  lineHeight: 19,
                }}
              >
                {warning}
              </Text>
            </View>
          ))}
        </View>
      )}
    </>
  );
}