import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  Animated,
  Vibration,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import useVitalsStore from "../src/store/vitalsStore";
import { Colors } from "../constants/colors";

// severity → visual configuration
const SEVERITY_CONFIG = {
  critical: {
    icon: "alert-circle" as const,
    color: "#ef4444",
    bgColor: "#1c0a0a",
    borderColor: "#ef444440",
    title: "Critical Alert",
    vibrationPattern: [0, 500, 200, 500, 200, 500],
    // vibrate 3 times for critical — cannot be ignored
  },
  high: {
    icon: "warning" as const,
    color: "#f97316",
    bgColor: "#1a1000",
    borderColor: "#f9731640",
    title: "High Alert",
    vibrationPattern: [0, 400, 200, 400],
  },
  medium: {
    icon: "alert" as const,
    color: "#f59e0b",
    bgColor: "#1a1400",
    borderColor: "#f59e0b40",
    title: "Health Alert",
    vibrationPattern: [0, 300],
  },
  low: {
    icon: "information-circle" as const,
    color: "#3b82f6",
    bgColor: Colors.card,
    borderColor: Colors.cardBorder,
    title: "Notice",
    vibrationPattern: [],
   
  },
};

export default function AnomalyPopup() {
  const { activeAlert, clearActiveAlert } = useVitalsStore();
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  const opacityAnim = useRef(new Animated.Value(0)).current;

  const isVisible = activeAlert !== null;
  // popup is visible whenever there's an active alert

  useEffect(() => {
    if (isVisible && activeAlert) {
      const config =
        SEVERITY_CONFIG[activeAlert.severity as keyof typeof SEVERITY_CONFIG]
        ?? SEVERITY_CONFIG.low;

      
      if (config.vibrationPattern.length > 0) {
        Vibration.vibrate(config.vibrationPattern);
      }

      
      Animated.parallel([
      
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
   
      scaleAnim.setValue(0.8);
      opacityAnim.setValue(0);
    }
  }, [isVisible, activeAlert, scaleAnim, opacityAnim]);

  if (!activeAlert) return null;


  const config =
    SEVERITY_CONFIG[activeAlert.severity as keyof typeof SEVERITY_CONFIG]
    ?? SEVERITY_CONFIG.low;

  const handleDismiss = () => {
    console.log("AnomalyPopup: dismissed by user");
    Vibration.cancel();
  
    clearActiveAlert();
   
  };

  return (
    <Modal
      transparent
      visible={isVisible}
      animationType="none"
      
      statusBarTranslucent
   
    >
      {/* Dark overlay behind the popup */}
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.7)",
          justifyContent: "center",
          alignItems: "center",
          padding: 24,
        }}
      >
        {/* Animated popup card */}
        <Animated.View
          style={{
            width: "100%",
            backgroundColor: config.bgColor,
            borderRadius: 20,
            borderWidth: 1.5,
            borderColor: config.borderColor,
            overflow: "hidden",
            transform: [{ scale: scaleAnim }],
            opacity: opacityAnim,
          }}
        >
          {/* Colored top bar — severity indicator */}
          <View
            style={{ height: 4, backgroundColor: config.color }}
          />

          <View style={{ padding: 20 }}>
            {/* Icon + title row */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                marginBottom: 16,
              }}
            >
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  backgroundColor: `${config.color}20`,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons
                  name={config.icon}
                  size={26}
                  color={config.color}
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: "700",
                    color: config.color,
                    letterSpacing: 1,
                    textTransform: "uppercase",
                    marginBottom: 3,
                  }}
                >
                  {config.title}
                </Text>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "800",
                    color: Colors.textPrimary,
                    lineHeight: 22,
                  }}
                >
                  {activeAlert.message}
                </Text>
              </View>
            </View>

            {/* Vitals snapshot — what was happening when alert fired */}
            {activeAlert.vitalsSnapshot && (
              <View
                style={{
                  backgroundColor: Colors.background,
                  borderRadius: 12,
                  padding: 12,
                  marginBottom: 16,
                  borderWidth: 1,
                  borderColor: Colors.cardBorder,
                }}
              >
                <Text
                  style={{
                    fontSize: 10,
                    fontWeight: "700",
                    color: Colors.textMuted,
                    letterSpacing: 0.8,
                    textTransform: "uppercase",
                    marginBottom: 10,
                  }}
                >
                  Vitals at time of alert
                </Text>

                <View
                  style={{
                    flexDirection: "row",
                    flexWrap: "wrap",
                    gap: 8,
                  }}
                >
                  {[
                    {
                      label: "Heart Rate",
                      value: activeAlert.vitalsSnapshot.heartRate,
                      unit: "bpm",
                    },
                    {
                      label: "SpO₂",
                      value: activeAlert.vitalsSnapshot.spO2,
                      unit: "%",
                    },
                    {
                      label: "Temp",
                      value: activeAlert.vitalsSnapshot.bodyTemperature,
                      unit: "°C",
                    },
                  ]
                    .filter((v) => v.value !== null && v.value !== undefined)
                    .map((vital) => (
                      <View
                        key={vital.label}
                        style={{
                          backgroundColor: Colors.card,
                          borderRadius: 8,
                          paddingHorizontal: 10,
                          paddingVertical: 6,
                          alignItems: "center",
                          minWidth: 80,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 16,
                            fontWeight: "700",
                            color: Colors.textPrimary,
                          }}
                        >
                          {vital.value}
                          <Text
                            style={{
                              fontSize: 10,
                              color: Colors.textMuted,
                            }}
                          >
                            {vital.unit}
                          </Text>
                        </Text>
                        <Text
                          style={{
                            fontSize: 9,
                            color: Colors.textMuted,
                            marginTop: 2,
                          }}
                        >
                          {vital.label}
                        </Text>
                      </View>
                    ))}
                </View>
              </View>
            )}

            {/* Timestamp */}
            <Text
              style={{
                fontSize: 11,
                color: Colors.textMuted,
                marginBottom: 16,
              }}
            >
              Detected at{" "}
              {new Date().toLocaleTimeString("en-GB", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
            </Text>

            {/* Action buttons */}
            <View style={{ flexDirection: "row", gap: 10 }}>
              <TouchableOpacity
                onPress={handleDismiss}
                style={{
                  flex: 1,
                  backgroundColor: Colors.card,
                  borderRadius: 12,
                  padding: 13,
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: Colors.cardBorder,
                }}
                activeOpacity={0.8}
              >
                <Text
                  style={{
                    color: Colors.textSecondary,
                    fontWeight: "600",
                    fontSize: 14,
                  }}
                >
                  Dismiss
                </Text>
              </TouchableOpacity>

              {/* Only show SOS for critical/high severity */}
              {(activeAlert.severity === "critical" ||
                activeAlert.severity === "high") && (
                <TouchableOpacity
                  onPress={() => {
                    console.log("AnomalyPopup: SOS triggered from popup");
                    handleDismiss();
                  
                  }}
                  style={{
                    flex: 1,
                    backgroundColor: "#ef4444",
                    borderRadius: 12,
                    padding: 13,
                    alignItems: "center",
                  }}
                  activeOpacity={0.85}
                >
                  <Text
                    style={{
                      color: "white",
                      fontWeight: "700",
                      fontSize: 14,
                    }}
                  >
                    🆘 SOS
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}