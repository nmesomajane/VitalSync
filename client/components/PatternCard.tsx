import React from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AIPattern } from "../src/services/ai";
import { Colors } from "../constants/colors";

interface PatternCardProps {
  pattern: AIPattern;
  vitalsContext: {
    averages: Record<string, number | null>;
    totalAnomalies: number;
    daysAnalysed: number;
  };
  generatedAt: string;
}

// maps backend pattern names to user-friendly display

const PATTERN_DISPLAY: Record<string, { label: string; description: string; icon: string; color: string }> = {
  normal_variation: {
    label: "All Vitals Normal",
    description:
      "Your vitals are within healthy ranges. Focus on maintaining your current lifestyle.",
    icon: "checkmark-circle",
    color: "#10b981",
    // green — everything is fine
  },
  sustained_tachycardia: {
    label: "Elevated Heart Rate",
    description:
      "Your heart rate has been consistently above normal. Stress, caffeine, or physical activity may be contributing.",
    icon: "heart",
    color: "#ef4444",
    // red — cardiovascular concern
  },
  bradycardia_tendency: {
    label: "Low Heart Rate Trend",
    description:
      "Your heart rate has been running lower than normal. Monitor closely if you experience dizziness or fatigue.",
    icon: "heart-outline",
    color: "#f59e0b",
    // amber — worth monitoring
  },
  hypoxemia: {
    label: "Low Blood Oxygen",
    description:
      "Your SpO₂ readings have been below optimal levels. Breathing exercises and fresh air may help.",
    icon: "water",
    color: "#ef4444",
    // red — clinically significant
  },
  persistent_fever: {
    label: "Elevated Temperature",
    description:
      "Your body temperature has been above normal. Rest, hydration, and medical evaluation may be needed.",
    icon: "thermometer",
    color: "#f97316",
    // orange — temperature concern
  },
  elevated_respiratory_rate: {
    label: "Elevated Breathing Rate",
    description:
      "Your respiratory rate has been above the normal range. Breathing techniques may help regulate this.",
    icon: "pulse",
    color: "#8b5cf6",
    // purple — respiratory concern
  },
  cardiorespiratory_strain: {
    label: "Cardiorespiratory Strain",
    description:
      "Multiple vitals show mild strain. Reducing strenuous activity and improving sleep quality may help.",
    icon: "fitness",
    color: "#f59e0b",
    // amber — multiple systems affected
  },
};

// maps risk level to color
const RISK_COLORS: Record<string, string> = {
  low: "#10b981",
  monitor: "#3b82f6",
  moderate: "#f59e0b",
  elevated: "#f97316",
  high: "#ef4444",
};

export default function PatternCard({
  pattern,
  vitalsContext,
  generatedAt,
}: PatternCardProps) {
  const display =
    PATTERN_DISPLAY[pattern.name] ?? PATTERN_DISPLAY.normal_variation;
  // fallback to normal_variation if pattern name isn't in our map

  const riskColor =
    RISK_COLORS[pattern.riskLevel.toLowerCase()] ?? Colors.primary;
  

  return (
    <View
      style={{
        marginHorizontal: 16,
        marginBottom: 16,
        backgroundColor: Colors.card,
        borderRadius: 18,
        overflow: "hidden",
   
        borderWidth: 1,
        borderColor: Colors.cardBorder,
      }}
    >
      {/* Colored top accent bar — quick visual signal of severity */}
      <View
        style={{
          height: 4,
          backgroundColor: display.color,
         
        }}
      />

      <View style={{ padding: 16 }}>
        {/* Pattern icon + label row */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            marginBottom: 12,
          }}
        >
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 13,
              backgroundColor: `${display.color}15`,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons
              name={display.icon as any}
              size={22}
              color={display.color}
            />
          </View>

          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 15,
                fontWeight: "700",
                color: Colors.textPrimary,
              }}
            >
              {display.label}
            </Text>

            {/* Risk level badge */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 5,
                marginTop: 4,
              }}
            >
              <View
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: riskColor,
                }}
              />
              <Text
                style={{
                  fontSize: 11,
                  color: riskColor,
                  fontWeight: "600",
                  textTransform: "capitalize",
                }}
              >
                {pattern.riskLevel} risk
              </Text>
            </View>
          </View>

          {/* AI badge */}
          <View
            style={{
              backgroundColor: `${Colors.primary}15`,
              borderRadius: 8,
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderWidth: 1,
              borderColor: `${Colors.primary}30`,
            }}
          >
            <Text
              style={{
                fontSize: 9,
                fontWeight: "700",
                color: Colors.primary,
                letterSpacing: 0.5,
              }}
            >
              AI
            </Text>
          </View>
        </View>

        {/* Pattern description */}
        <Text
          style={{
            fontSize: 13,
            color: Colors.textSecondary,
            lineHeight: 20,
            marginBottom: 14,
          }}
        >
          {display.description}
        </Text>

        {/* Urgency message from backend */}
        <View
          style={{
            backgroundColor: `${display.color}08`,
            borderRadius: 10,
            padding: 12,
            borderLeftWidth: 3,
            borderLeftColor: display.color,
            marginBottom: 14,
          }}
        >
          <Text
            style={{
              fontSize: 12,
              color: Colors.textSecondary,
              lineHeight: 18,
              fontStyle: "italic",
            }}
          >
            {pattern.urgency}
          </Text>
        </View>

        {/* Vitals context row */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            borderTopWidth: 1,
            borderTopColor: Colors.cardBorder,
            paddingTop: 12,
          }}
        >
          <ContextStat
            label="Days analysed"
            value={`${vitalsContext.daysAnalysed}`}
          />
          <ContextStat
            label="Anomalies"
            value={`${vitalsContext.totalAnomalies}`}
            highlight={vitalsContext.totalAnomalies > 0}
            // highlight = amber color when anomalies exist
          />
          <ContextStat
            label="Generated"
            value={new Date(generatedAt).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
            })}
          />
        </View>
      </View>
    </View>
  );
}


function ContextStat({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <View style={{ alignItems: "center" }}>
      <Text
        style={{
          fontSize: 15,
          fontWeight: "700",
          color: highlight ? Colors.warning : Colors.textPrimary,
        }}
      >
        {value}
      </Text>
      <Text style={{ fontSize: 10, color: Colors.textMuted, marginTop: 2 }}>
        {label}
      </Text>
    </View>
  );
}