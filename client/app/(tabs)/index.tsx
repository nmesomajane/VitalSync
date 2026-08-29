import  React, { useState } from "react";
import {
  View, Text, ScrollView,
  TouchableOpacity, Alert,
  ActivityIndicator, RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons} from "@expo/vector-icons";
import { useSocket } from "../../hooks/useSocket";
import { useVitals } from "../../hooks/useVitals";
import useVitalsStore from "../../src/store/vitalsStore";
import useAuthStore from "../../src/store/authStore";
import VitalCard from "../../components/vitalCard";
import HealthScoreRing from "../../components/HealthScoreRing";
import AlertBanner from "../../components/AlertBanner";
import { triggerSOS } from "../../src/services/vitals";
import { Colors } from "../../constants/colors";
import DeviceConnectionSheet from "../../components/DeviceConnectionSheet";
import useBLEStore from "../../src/store/bleStore";


export default function DashboardScreen() {
  const { user } = useAuthStore();
  const { latestVitals, isConnected, lastReadingAt } = useVitalsStore();

  const { isLoading } = useVitals();
  useSocket();
  const [showBLESheet, setShowBLESheet] = useState(false);
const { connectionState, deviceName,  } = useBLEStore();
const bleConnected = connectionState === "connected";


  const insets = useSafeAreaInsets();
  const [sosLoading, setSosLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // ── connection status logic ─────────────────────────────────
  const getConnectionStatus = (): {
    label: string;
    color: string;
    isLive: boolean;
  } => {
    if (!isConnected) {
      // WebSocket dropped — not connected to server at all
      return { label: "OFFLINE", color: Colors.offline, isLive: false };
    }

    if (!lastReadingAt) {
      // connected to server but hardware hasn't sent anything yet
    
      return { label: "LIVE", color: Colors.online, isLive: false };
     
    }

    const secondsSince =
      (Date.now() - new Date(lastReadingAt).getTime()) / 1000;

    if (secondsSince < 10) {
      
      return { label: "LIVE", color: Colors.online, isLive: true };
    }

    
    return { label: "LIVE", color: Colors.online, isLive: false };
  };

  const connectionStatus = getConnectionStatus();


  const showStaleDataBanner =
    latestVitals !== null && !connectionStatus.isLive;
  

  //  rest of your existing functions 
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

        {/* Header */}
        <View style={{
          paddingTop: insets.top + 12,
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

            {/*  connection indicator  */}
            <View style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 5,
              backgroundColor: `${connectionStatus.color}15`,
              paddingHorizontal: 10,
              paddingVertical: 5,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: `${connectionStatus.color}30`,
            }}>
              <View style={{
                width: 6, height: 6, borderRadius: 3,
                backgroundColor: connectionStatus.color,
              }} />
              <Text style={{
                fontSize: 10,
                fontWeight: "700",
                color: connectionStatus.color,
                letterSpacing: 0.5,
              }}>
                {connectionStatus.label}
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

        {/* STALE DATA WARNING BANNER */}
        {showStaleDataBanner && (
          <View style={{
            marginHorizontal: 16,
            marginBottom: 12,
            backgroundColor: `${Colors.warning}10`,
            borderRadius: 12,
            padding: 12,
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            borderWidth: 1,
            borderColor: `${Colors.warning}30`,
          }}>
            <Ionicons
              name="hardware-chip-outline"
              size={16}
              color={Colors.warning}
            />
            <View style={{ flex: 1 }}>
              <Text style={{
                color: Colors.warning,
                fontSize: 12,
                fontWeight: "600",
              }}>
                Showing last recorded data
              </Text>
              <Text style={{
                color: Colors.textMuted,
                fontSize: 11,
                marginTop: 1,
              }}>
                Connect your VitalSync device for live monitoring
              </Text>
            </View>
          </View>
        )}

        <TouchableOpacity
  onPress={() => setShowBLESheet(true)}
  style={{
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: bleConnected ? "#0d2a1a" : Colors.card,
    borderRadius: 14,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: bleConnected ? "#16653440" : Colors.cardBorder,
  }}
  activeOpacity={0.85}
>
  {/* Icon */}
  <View style={{
    width: 38, height: 38,
    borderRadius: 11,
    backgroundColor: bleConnected ? "#10b98120" : `${Colors.primary}15`,
    alignItems: "center",
    justifyContent: "center",
  }}>
    <Ionicons
      name={bleConnected ? "bluetooth" : "bluetooth-outline"}
      size={20}
      color={bleConnected ? "#10b981" : Colors.primary}
    />
  </View>

  {/* Text */}
  <View style={{ flex: 1 }}>
    <Text style={{
      fontSize: 13, fontWeight: "600", color: Colors.textPrimary,
    }}>
      {bleConnected
        ? deviceName ?? "VitalSync-ESP32"
        : "Connect Hardware Device"}
    </Text>
    <Text style={{ fontSize: 11, color: Colors.textMuted, marginTop: 2 }}>
      {bleConnected
        ? lastReadingAt
          ? `Last reading: ${new Date(lastReadingAt).toLocaleTimeString()}`
          : "Waiting for first measurement..."
        : "Tap to pair via Bluetooth"}
    </Text>
  </View>

  {/* Status badge */}
  <View style={{
    backgroundColor: bleConnected ? "#10b98115" : `${Colors.primary}15`,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: bleConnected ? "#10b98130" : `${Colors.primary}30`,
  }}>
    <Text style={{
      fontSize: 10, fontWeight: "700", letterSpacing: 0.5,
      color: bleConnected ? "#10b981" : Colors.primary,
    }}>
      {bleConnected ? "LIVE" : "CONNECT"}
    </Text>
  </View>
</TouchableOpacity>

{/* The BLE connection sheet */}
<DeviceConnectionSheet
  visible={showBLESheet}
  onClose={() => setShowBLESheet(false)}
/>

        {/* Health Score Card — unchanged */}
        <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
          <View style={{
            backgroundColor: Colors.primary,
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

        {/* Section title — unchanged */}
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
            {connectionStatus.isLive ? "Streaming live" : latestVitals ? "Last recorded" : "No device connected"}
            {/* dynamically shows the data source */}
          </Text>
        </View>

        {/* Vitals Grid — unchanged */}
        <View style={{ paddingHorizontal: 16 }}>
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

        {/* Empty state — unchanged */}
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
            <Ionicons name="hardware-chip-outline" size={40} color={Colors.textMuted} />
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

        {/* SOS Button — unchanged */}
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
              {sosLoading
                ? <ActivityIndicator color="white" size="small" />
                : <Ionicons name="alert-circle" size={26} color="white" />}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: Colors.danger, fontWeight: "700", fontSize: 15 }}>
                Emergency SOS
              </Text>
              <Text style={{ color: Colors.textMuted, fontSize: 12, marginTop: 2 }}>
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