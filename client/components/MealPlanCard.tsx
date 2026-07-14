import React from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ParsedSuggestions } from "../hooks/useAI";
import { Colors } from "../constants/colors";

interface MealPlanCardProps {
  mealPlan: ParsedSuggestions["mealPlan"];
  // the four parsed meal recommendations
}


const MEALS = [
  {
    key: "breakfast" as const,
    label: "Breakfast",
    icon: "sunny-outline" as const,
    time: "6:00 – 9:00 AM",
    color: "#f59e0b",
    // amber for morning
  },
  {
    key: "lunch" as const,
    label: "Lunch",
    icon: "partly-sunny-outline" as const,
    time: "12:00 – 2:00 PM",
    color: "#10b981",
    // green for midday
  },
  {
    key: "dinner" as const,
    label: "Dinner",
    icon: "moon-outline" as const,
    time: "6:00 – 8:00 PM",
    color: "#3b82f6",
    // blue for evening
  },
  {
    key: "snack" as const,
    label: "Healthy Snack",
    icon: "leaf-outline" as const,
    time: "Anytime",
    color: "#8b5cf6",
    // purple for snack
  },
];

export default function MealPlanCard({ mealPlan }: MealPlanCardProps) {
  return (
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
      {/* Section header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          marginBottom: 16,
        }}
      >
        <Ionicons
          name="restaurant-outline"
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
          Meal Plan
        </Text>
        <View
          style={{
            marginLeft: "auto",
            // pushes the badge to the right
            backgroundColor: `${Colors.primary}15`,
            borderRadius: 6,
            paddingHorizontal: 8,
            paddingVertical: 3,
          }}
        >
          <Text
            style={{
              fontSize: 9,
              color: Colors.primary,
              fontWeight: "700",
              letterSpacing: 0.5,
            }}
          >
            AI GENERATED
          </Text>
        </View>
      </View>

      {/* Each meal */}
      {MEALS.map((meal, index) => (
        <View
          key={meal.key}
          style={{
            flexDirection: "row",
            alignItems: "flex-start",
            gap: 12,
            paddingBottom: index < MEALS.length - 1 ? 14 : 0,
            marginBottom: index < MEALS.length - 1 ? 14 : 0,
            borderBottomWidth: index < MEALS.length - 1 ? 1 : 0,
            borderBottomColor: Colors.cardBorder,
            // divider between meals except after the last one
          }}
        >
          {/* Meal icon */}
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              backgroundColor: `${meal.color}15`,
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Ionicons name={meal.icon} size={18} color={meal.color} />
          </View>

          {/* Meal content */}
          <View style={{ flex: 1 }}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "flex-start",
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
                {meal.label}
              </Text>
              <Text
                style={{
                  fontSize: 10,
                  color: Colors.textMuted,
                  marginLeft: 8,
                }}
              >
                {meal.time}
              </Text>
            </View>

            <Text
              style={{
                fontSize: 13,
                color: Colors.textSecondary,
                lineHeight: 19,
              }}
            >
              {mealPlan[meal.key]}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}