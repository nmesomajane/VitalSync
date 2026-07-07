import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AlertItem } from "../src/services/history";
import { Colors } from "../constants/colors";

interface AlertListItemProps {
  alert: AlertItem;
  onAcknowledge: (id: string) => void;
}


const SEVERITY_CONFIG = {
  critical: { icon: "alert-circle" as const, color: "#ef4444" },
  high: { icon: "warning" as const, color: "#f97316" },
  medium: { icon: "alert" as const, color: "#f59e0b" },
  low: { icon: "information-circle" as const, color: "#3b82f6" },
};

// alert type 
const TYPE_LABELS = {
  threshold_breach: "Threshold Breach",
  sos: "Emergency SOS",
  device_disconnected: "Device Disconnected",
};

export default function AlertListItem({
  alert,
  onAcknowledge,
}: AlertListItemProps) {
  const config =
    SEVERITY_CONFIG[alert.severity] ?? SEVERITY_CONFIG.low;
  // get the icon and color for this severity level

  const isAcknowledged = alert.acknowledged;


  return (
    <View
      style={{
        backgroundColor: isAcknowledged ? Colors.card : `${config.color}08`,
       
        borderRadius: 14,
        padding: 14,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: isAcknowledged
          ? Colors.cardBorder
          : `${config.color}30`,
       
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 12,
      }}
    >
      {/* Severity icon */}
      <View
        style={{
          width: 38,
          height: 38,
          borderRadius: 10,
          backgroundColor: `${config.color}15`,
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
         
          marginTop: 2,
        }}
      >
        <Ionicons name={config.icon} size={20} color={config.color} />
      </View>

      {/* Content */}
      <View style={{ flex: 1 }}>

        {/* Type ,severity row */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            marginBottom: 4,
            flexWrap: "wrap",
          }}
        >
          {/* Alert type label */}
          <Text
            style={{
              fontSize: 12,
              fontWeight: "700",
              color: isAcknowledged ? Colors.textSecondary : config.color,
            }}
          >
            {TYPE_LABELS[alert.type] ?? alert.type}
          </Text>

          {/* Severity badge */}
          <View
            style={{
              backgroundColor: `${config.color}15`,
              paddingHorizontal: 6,
              paddingVertical: 2,
              borderRadius: 6,
            }}
          >
            <Text
              style={{
                fontSize: 9,
                fontWeight: "700",
                color: config.color,
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              {alert.severity}
            </Text>
          </View>

          {/* Unread dot */}
          {!isAcknowledged && (
            <View
              style={{
                width: 7,
                height: 7,
                borderRadius: 3.5,
                backgroundColor: config.color,
                
              }}
            />
          )}
        </View>

        {/* Message */}
        <Text
          style={{
            fontSize: 12,
            color: Colors.textSecondary,
            lineHeight: 18,
            marginBottom: 8,
          }}
        >
          {alert.message}
        </Text>

        {/* Timestamp + acknowledge button */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          {/* When it happened */}
          <Text style={{ fontSize: 11, color: Colors.textMuted }}>
            {new Date(alert.createdAt).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            })}
           
          </Text>

          {/* Acknowledge button  only shown for unread alerts */}
          {!isAcknowledged && (
            <TouchableOpacity
              onPress={() => {
                console.log("AlertListItem: acknowledging", alert.id);
                onAcknowledge(alert.id);
              }}
              style={{
                backgroundColor: `${config.color}15`,
                borderRadius: 8,
                paddingHorizontal: 10,
                paddingVertical: 5,
                borderWidth: 1,
                borderColor: `${config.color}30`,
              }}
              activeOpacity={0.7}
            >
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "600",
                  color: config.color,
                }}
              >
                Acknowledge
              </Text>
            </TouchableOpacity>
          )}

          {/* Shown instead of button when acknowledged */}
          {isAcknowledged && (
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
            >
              <Ionicons
                name="checkmark-circle"
                size={12}
                color={Colors.textMuted}
              />
              <Text style={{ fontSize: 11, color: Colors.textMuted }}>
                Seen
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}