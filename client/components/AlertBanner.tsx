import { View, Text, TouchableOpacity, Animated} from "react-native";
import React, { useEffect, useRef } from "react";
import useVitalsStore from "@/store/vitalsStore";

export default function AlertBanner() {
  const { activeAlert, clearActiveAlert } = useVitalsStore();
 

  const slideAnim = useRef(new Animated.Value(-100)).current;
  

  useEffect(() => {
    if (activeAlert) {
    
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [activeAlert]);
  

  if (!activeAlert) return null;

  const getSeverityColor = () => {
    switch (activeAlert.severity) {
      case "critical": return "#e94560";
      case "high":     return "#f97316";
      case "medium":   return "#fbbf24";
      default:         return "#4ade80";
    }
  };

  const getSeverityIcon = () => {
    switch (activeAlert.severity) {
      case "critical": return "🚨";
      case "high":     return "⚠️";
      case "medium":   return "⚡";
      default:         return "ℹ️";
    }
  };

  return (
    <Animated.View
    
      style={{
        transform: [{ translateY: slideAnim }],
       
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 999,
      
        backgroundColor: "#0a0f1a",
        borderBottomWidth: 2,
        borderBottomColor: getSeverityColor(),
        padding: 16,
        paddingTop: 48,
      
      }}
    >
      <View style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
      }}>
        <Text style={{ fontSize: 24 }}>{getSeverityIcon()}</Text>

        <View style={{ flex: 1 }}>
          <Text style={{
            color: getSeverityColor(),
            fontWeight: "700",
            fontSize: 13,
          }}>
            {activeAlert.severity?.toUpperCase()} ALERT
          </Text>
          <Text style={{ color: "#94a3b8", fontSize: 12, marginTop: 2 }}>
            {activeAlert.message}
          </Text>
        </View>

        {/* Dismiss button */}
        <TouchableOpacity
          onPress={() => {
            console.log("AlertBanner: dismissed by user");
            clearActiveAlert();
        
          }}
          style={{
            backgroundColor: "#1e293b",
            borderRadius: 8,
            padding: 6,
          }}
        >
          <Text style={{ color: "#64748b", fontSize: 12 }}>✕</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}