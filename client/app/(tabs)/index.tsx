import { useState } from "react";
import {
  View, Text, ScrollView,
  TouchableOpacity, Alert,
  ActivityIndicator, RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useSocket } from "../../hooks/useSocket";
import { useVitals } from "../../hooks/useVitals";
import useVitalsStore from "../../src/store/vitalsStore";
import useAuthStore from "../../src/store/authStore";
import VitalCard from "../../components/vitalCard";
import HealthScoreRing from "../../components/HealthScoreRing";
import AlertBanner from "../../components/AlertBanner";
import { triggerSOS } from "../../src/services/vitals";
import { Colors } from "../../constants/colors";
import React from "react";

export default function DashboardScreen() {
  const { user } = useAuthStore();
  const { latestVitals, isConnected } = useVitalsStore();
  const { isLoading } = useVitals();
  useSocket();

  const insets = useSafeAreaInsets();
  // get safe area insets for this screen too
  // paddingTop: insets.top ensures content clears the status bar
  // on all phones — notched, punch-hole, or regular

  const [sosLoading, setSosLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const getStatus = (
    value: number | null, min: number, max: number
  ): "Normal" | "High" | "Low" | "Critical" | undefined => {
    if (value === null) return undefined;
    const percentOver = ((value - max) / max) * 100;
    const percentUnder = ((min - value) / min) * 100;
    if (value > max) return percentOver > 30 ? "Critical" : "High";
    if (value < min) return percentUnder > 30 ? "Critical" : "Low";
    return "Normal";
  };

  const getGreeting = (): string => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise(r => setTimeout(r, 1000));
    setRefreshing(false);
  };

  const handleSOS = () => {
    Alert.alert(
      "Emergency SOS",
      "This will immediately alert all your caregivers with your current vitals.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Send SOS",
          style: "destructive",
          onPress: async () => {
            setSosLoading(true);
            try {
              await triggerSOS({
                heartRate: latestVitals?.heartRate ?? undefined,
                spO2: latestVitals?.spO2 ?? undefined,
                bodyTemperature: latestVitals?.bodyTemperature ?? undefined,
              });
              Alert.alert("SOS Sent", "Your caregivers have been notified.");
            } catch {
              Alert.alert("SOS Failed", "Please try again.");
            } finally {
              setSosLoading(false);
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={{
        flex: 1,
        backgroundColor: Colors.background,
        justifyContent: "center",
        alignItems: "center",
      }}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={{ color: Colors.textSecondary, marginTop: 12, fontSize: 14 }}>
          Loading vitals...
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>

      <AlertBanner />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
          />
        }
      >

        {/* ── Header ────────────────────────────────────────── */}
        <View style={{
          paddingTop: insets.top + 12,
          // insets.top = status bar height on this specific phone
          // ensures content never goes under status bar icons
          paddingHorizontal: 20,
          paddingBottom: 16,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}>
          <View>
            <Text style={{ fontSize: 13, color: Colors.textSecondary }}>
              {getGreeting()},
            </Text>
            <Text style={{
              fontSize: 22,
              fontWeight: "700",
              color: Colors.textPrimary,
              marginTop: 2,
            }}>
              {user?.name ?? "Patient"}
            </Text>
          </View>

          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            {/* Connection status */}
            <View style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 5,
              backgroundColor: isConnected
                ? `${Colors.online}15`
                : `${Colors.offline}15`,
              paddingHorizontal: 10,
              paddingVertical: 5,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: isConnected
                ? `${Colors.online}30`
                : `${Colors.offline}30`,
            }}>
              <View style={{
                width: 6, height: 6, borderRadius: 3,
                backgroundColor: isConnected ? Colors.online : Colors.offline,
              }} />
              <Text style={{
                fontSize: 10,
                fontWeight: "700",
                color: isConnected ? Colors.online : Colors.offline,
                letterSpacing: 0.5,
              }}>
                {isConnected ? "LIVE" : "OFFLINE"}
              </Text>
            </View>

            {/* Notification bell */}
            <TouchableOpacity style={{
              width: 36, height: 36,
              backgroundColor: Colors.card,
              borderRadius: 10,
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1,
              borderColor: Colors.cardBorder,
            }}>
              <Ionicons
                name="notifications-outline"
                size={18}
                color={Colors.textSecondary}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Health Score Card ─────────────────────────────── */}
        <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
          <View style={{
            backgroundColor: Colors.primary,
            // blue gradient card for health score
            borderRadius: 20,
            padding: 20,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}>
            <View style={{ flex: 1 }}>
              <Text style={{
                fontSize: 11,
                fontWeight: "700",
                color: "rgba(255,255,255,0.7)",
                letterSpacing: 1,
                textTransform: "uppercase",
              }}>
                Health Score
              </Text>
              <Text style={{
                fontSize: 36,
                fontWeight: "800",
                color: "white",
                marginTop: 4,
              }}>
                {latestVitals?.healthScore ?? "--"}
                <Text style={{ fontSize: 16, fontWeight: "500" }}>/100</Text>
              </Text>
              <Text style={{
                fontSize: 12,
                color: "rgba(255,255,255,0.7)",
                marginTop: 4,
              }}>
                {latestVitals
                  ? `Updated ${new Date(latestVitals.createdAt).toLocaleTimeString()}`
                  : "Connect device to see score"}
              </Text>
            </View>

            <HealthScoreRing
              score={latestVitals?.healthScore ?? null}
              size={80}
            />
          </View>
        </View>

        {/* ── Section title ─────────────────────────────────── */}
        <View style={{
          paddingHorizontal: 20,
          marginBottom: 12,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}>
          <Text style={{
            fontSize: 16,
            fontWeight: "700",
            color: Colors.textPrimary,
          }}>
            Vital Signs
          </Text>
          <Text style={{ fontSize: 12, color: Colors.textSecondary }}>
            {latestVitals ? "Live data" : "No device connected"}
          </Text>
        </View>

        {/* ── Vitals Grid ───────────────────────────────────── */}
        <View style={{ paddingHorizontal: 16 }}>

          {/* Row 1 */}
          <View style={{ flexDirection: "row", gap: 10, marginBottom: 10 }}>
            <VitalCard
              iconName="heart"
              iconSet="ionicons"
              label="Heart Rate"
              value={latestVitals?.heartRate ?? null}
              unit="bpm"
              color={Colors.heartRate}
              status={getStatus(latestVitals?.heartRate ?? null, 60, 100)}
            />
            <VitalCard
              iconName="water"
              iconSet="ionicons"
              label="Blood Oxygen"
              value={latestVitals?.spO2 ?? null}
              unit="%"
              color={Colors.spO2}
              status={getStatus(latestVitals?.spO2 ?? null, 94, 100)}
            />
          </View>

          {/* Row 2 */}
          <View style={{ flexDirection: "row", gap: 10, marginBottom: 10 }}>
            <VitalCard
              iconName="thermometer"
              iconSet="ionicons"
              label="Body Temp"
              value={latestVitals?.bodyTemperature ?? null}
              unit="°C"
              color={Colors.temperature}
              status={getStatus(latestVitals?.bodyTemperature ?? null, 36.1, 37.5)}
            />
            <VitalCard
              iconName="water-outline"
              iconSet="ionicons"
              label="Humidity"
              value={latestVitals?.roomHumidity ?? null}
              unit="%"
              color={Colors.humidity}
              status={getStatus(latestVitals?.roomHumidity ?? null, 30, 70)}
            />
          </View>

          {/* Row 3 — full width */}
          <VitalCard
            iconName="lungs"
            iconSet="material"
            label="Respiratory Rate"
            value={latestVitals?.respiratoryRate ?? null}
            unit="/min"
            color={Colors.respiratory}
            status={getStatus(latestVitals?.respiratoryRate ?? null, 12, 20)}
          />
        </View>

        {/* ── No device connected ───────────────────────────── */}
        {!latestVitals && (
          <View style={{
            marginHorizontal: 16,
            marginTop: 16,
            backgroundColor: Colors.card,
            borderRadius: 16,
            padding: 24,
            alignItems: "center",
            borderWidth: 1,
            borderColor: Colors.cardBorder,
            borderStyle: "dashed",
          }}>
            <Ionicons
              name="hardware-chip-outline"
              size={40}
              color={Colors.textMuted}
            />
            <Text style={{
              color: Colors.textPrimary,
              fontWeight: "700",
              fontSize: 15,
              marginTop: 12,
            }}>
              No device connected
            </Text>
            <Text style={{
              color: Colors.textSecondary,
              fontSize: 13,
              marginTop: 6,
              textAlign: "center",
              lineHeight: 20,
            }}>
              Connect your VitalSync hardware device to start monitoring your vitals in real time
            </Text>
          </View>
        )}

        {/* ── SOS Button ────────────────────────────────────── */}
        <View style={{ paddingHorizontal: 16, marginTop: 16 }}>
          <TouchableOpacity
            onPress={handleSOS}
            disabled={sosLoading}
            activeOpacity={0.85}
            style={{
              backgroundColor: "#1a0808",
              borderRadius: 16,
              padding: 18,
              flexDirection: "row",
              alignItems: "center",
              gap: 14,
              borderWidth: 1.5,
              borderColor: `${Colors.danger}40`,
            }}
          >
            <View style={{
              width: 48, height: 48,
              borderRadius: 14,
              backgroundColor: Colors.danger,
              alignItems: "center",
              justifyContent: "center",
            }}>
              {sosLoading ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Ionicons name="alert-circle" size={26} color="white" />
              )}
            </View>

            <View style={{ flex: 1 }}>
              <Text style={{
                color: Colors.danger,
                fontWeight: "700",
                fontSize: 15,
              }}>
                Emergency SOS
              </Text>
              <Text style={{
                color: Colors.textMuted,
                fontSize: 12,
                marginTop: 2,
              }}>
                Instantly alerts all caregivers
              </Text>
            </View>

            <View style={{
              backgroundColor: `${Colors.danger}15`,
              borderRadius: 8,
              paddingHorizontal: 10,
              paddingVertical: 5,
              borderWidth: 1,
              borderColor: `${Colors.danger}30`,
            }}>
              <Text style={{
                color: Colors.danger,
                fontSize: 10,
                fontWeight: "700",
                letterSpacing: 0.5,
              }}>
                HOLD
              </Text>
            </View>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </View>
  );
}