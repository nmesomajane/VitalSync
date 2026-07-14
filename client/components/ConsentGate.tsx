import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../constants/colors";

interface ConsentGateProps {
  onConsent: () => Promise<void>;
  
}


const DATA_SHARED = [
  {
    icon: "heart-outline" as const,
    title: "7-day vital averages",
    detail:
      "Average heart rate, SpO₂, temperature, respiratory rate — not individual readings",
    
  },
  {
    icon: "analytics-outline" as const,
    title: "Health pattern classification",
    detail:
      "The pattern your vitals follow e.g. elevated heart rate trend",
  },
  {
    icon: "warning-outline" as const,
    title: "Anomaly summary",
    detail: "Total number of readings outside normal range",
  },
];

// what is explicitly NOT shared
const DATA_NOT_SHARED = [
  "Your name, email, or any personal identifiers",
  "Individual readings with timestamps",
  "Your location or device information",
  "ECG waveform data",
];

export default function ConsentGate({ onConsent }: ConsentGateProps) {
  const [isLoading, setIsLoading] = useState<boolean>(false);


  const handleConsent = async () => {
    console.log("ConsentGate: user tapped Enable AI Features");
    setIsLoading(true);

    try {
      await onConsent();
    
    } catch (err) {
      console.error("ConsentGate: consent failed:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
    >
      {/* Hero icon */}
      <View style={{ alignItems: "center", marginBottom: 24, marginTop: 16 }}>
        <View
          style={{
            width: 80,
            height: 80,
            borderRadius: 24,
            backgroundColor: `${Colors.primary}15`,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 16,
            borderWidth: 1,
            borderColor: `${Colors.primary}30`,
          }}
        >
          <Ionicons name="sparkles" size={36} color={Colors.primary} />
        
        </View>

        <Text
          style={{
            fontSize: 22,
            fontWeight: "800",
            color: Colors.textPrimary,
            textAlign: "center",
            marginBottom: 8,
          }}
        >
          AI Health Insights
        </Text>

        <Text
          style={{
            fontSize: 14,
            color: Colors.textSecondary,
            textAlign: "center",
            lineHeight: 22,
            paddingHorizontal: 16,
          }}
        >
          Get personalised meal plans, daily routines, and health videos
          generated from your actual vitals data — not generic advice.
        </Text>
      </View>

      {/* What IS shared */}
      <View
        style={{
          backgroundColor: Colors.card,
          borderRadius: 16,
          padding: 16,
          marginBottom: 12,
          borderWidth: 1,
          borderColor: Colors.cardBorder,
        }}
      >
        <Text
          style={{
            fontSize: 12,
            fontWeight: "700",
            color: Colors.textSecondary,
            letterSpacing: 0.8,
            textTransform: "uppercase",
            marginBottom: 14,
          }}
        >
          What is sent to Gemini AI
        </Text>

        {DATA_SHARED.map((item, index) => (
          <View
            key={index}
            style={{
              flexDirection: "row",
              gap: 12,
              marginBottom: index < DATA_SHARED.length - 1 ? 14 : 0,
              // no bottom margin on the last item
              alignItems: "flex-start",
            }}
          >
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                backgroundColor: `${Colors.primary}15`,
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                marginTop: 1,
              }}
            >
              <Ionicons name={item.icon} size={16} color={Colors.primary} />
            </View>

            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "600",
                  color: Colors.textPrimary,
                  marginBottom: 2,
                }}
              >
                {item.title}
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  color: Colors.textMuted,
                  lineHeight: 17,
                }}
              >
                {item.detail}
              </Text>
            </View>
          </View>
        ))}
      </View>

      {/* What is NOT shared */}
      <View
        style={{
          backgroundColor: "#0d2a1a",
          // green tinted — signals safety / privacy
          borderRadius: 16,
          padding: 16,
          marginBottom: 24,
          borderWidth: 1,
          borderColor: "#16653430",
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
            name="shield-checkmark"
            size={16}
            color="#10b981"
          />
          <Text
            style={{
              fontSize: 12,
              fontWeight: "700",
              color: "#10b981",
              letterSpacing: 0.8,
              textTransform: "uppercase",
            }}
          >
            What is never shared
          </Text>
        </View>

        {DATA_NOT_SHARED.map((item, index) => (
          <View
            key={index}
            style={{
              flexDirection: "row",
              alignItems: "flex-start",
              gap: 8,
              marginBottom:
                index < DATA_NOT_SHARED.length - 1 ? 8 : 0,
            }}
          >
            <Ionicons
              name="close-circle"
              size={14}
              color="#10b981"
              style={{ marginTop: 2 }}
            />
            <Text
              style={{
                fontSize: 12,
                color: "#86efac",
           
                flex: 1,
                lineHeight: 18,
              }}
            >
              {item}
            </Text>
          </View>
        ))}

        <Text
          style={{
            fontSize: 11,
            color: "#4ade80",
            marginTop: 12,
            lineHeight: 16,
          }}
        >
          Gemini does not store data between requests. Each request is
          stateless. You can opt out at any time from your profile settings.
        </Text>
      </View>

      {/* Enable button */}
      <TouchableOpacity
        onPress={handleConsent}
        disabled={isLoading}
        activeOpacity={0.85}
        style={{
          backgroundColor: Colors.primary,
          borderRadius: 14,
          padding: 16,
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        {isLoading ? (
          <ActivityIndicator color="white" size="small" />
        ) : (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Ionicons name="sparkles" size={16} color="white" />
            <Text
              style={{
                color: "white",
                fontSize: 16,
                fontWeight: "700",
              }}
            >
              Enable AI Features
            </Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Decline note */}
      <Text
        style={{
          fontSize: 11,
          color: Colors.textMuted,
          textAlign: "center",
          lineHeight: 16,
          paddingHorizontal: 20,
        }}
      >
        Declining keeps all your health data on VitalSync servers only.
        All other app features work without AI enabled.
      </Text>
    </ScrollView>
  );
}