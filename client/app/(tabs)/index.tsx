import { useEffect } from "react";
import {
  View, Text, ScrollView,
  TouchableOpacity, Alert,
  ActivityIndicator, RefreshControl,
} from "react-native";
import { useSocket } from "../../hooks/useSocket";
import { useVitals } from "../../hooks/useVitals";
import useVitalsStore from "../../src/store/vitalsStore";
import useAuthStore from "../../src/store/authStore";
import VitalCard from "../../components/vitalCard";
import HealthScoreRing from "../../components/HealthScoreRing";
import AlertBanner from "../../components/AlertBanner";
import { triggerSOS } from "../../src/services/vitals";
import React ,{ useState } from "react";


export default function DashboardScreen() {
  const { user } = useAuthStore();
  // get logged-in user from global auth store

  const { latestVitals, isConnected } = useVitalsStore();


  const { isLoading } = useVitals();
  

  useSocket();
 

  const [sosLoading, setSosLoading] = useState(false);


  const [refreshing, setRefreshing] = useState(false);
  // pull-to-refresh state

  console.log("DashboardScreen rendered — user:", user?.name, "connected:", isConnected);


  const getStatus = (
    value: number | null,
    min: number,
    max: number
  ): "Normal" | "High" | "Low" | "Critical" | undefined => {
    if (value === null) return undefined;
    // undefined = no status badge shown when no data

    const percentOver = ((value - max) / max) * 100;
    const percentUnder = ((min - value) / min) * 100;

    if (value > max) {
      return percentOver > 30 ? "Critical" : "High";
    }
    if (value < min) {
      return percentUnder > 30 ? "Critical" : "Low";
    }
    return "Normal";
  };

  // pull to refresh 
  const onRefresh = async () => {
    setRefreshing(true);
    // RefreshControl spinner appears at top of ScrollView
    await new Promise(resolve => setTimeout(resolve, 1000));
    // wait 1 second — the WebSocket will have sent fresh data by then
    setRefreshing(false);
  };

  // SOS handler
  const handleSOS = () => {
    Alert.alert(
      "🚨 Emergency SOS",
      "This will immediately alert all your caregivers with your current vitals. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Send SOS",
          style: "destructive",
          onPress: async () => {
            console.log("Dashboard: SOS confirmed by user");
            setSosLoading(true);
            try {
              await triggerSOS({
                heartRate: latestVitals?.heartRate ?? undefined,
                spO2: latestVitals?.spO2 ?? undefined,
                bodyTemperature: latestVitals?.bodyTemperature ?? undefined,
              });
              Alert.alert(
                "SOS Sent ✅",
                "Your caregivers have been notified with your current vitals."
              );
            } catch (error) {
              console.error("Dashboard: SOS failed:", error);
              Alert.alert("SOS Failed", "Please try again or call emergency services.");
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
      <View style={{ flex: 1, backgroundColor: "#080c14", justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#e94560" />
        <Text style={{ color: "#64748b", marginTop: 12, fontSize: 13 }}>
          Loading your vitals...
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#080c14" }}>

      {/* AlertBanner floats on top of everything */}
      <AlertBanner />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#e94560"
            // tintColor = spinner color on iOS
          />
          
        }
      >

        
        <View style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          padding: 20,
          paddingTop: 52,
          // paddingTop:52 clears the phone's status bar
        }}>
          <View>
            <Text style={{ fontSize: 12, color: "#64748b" }}>
              Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"},
              {/* dynamically shows morning/afternoon/evening */}
            </Text>
            <Text style={{ fontSize: 20, fontWeight: "800", color: "#f1f5f9" }}>
              {user?.name ?? "Patient"} 👋
            </Text>
          </View>

          {/* Live/offline indicator */}
          <View style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            backgroundColor: isConnected ? "#0d2a1a" : "#1a1000",
            paddingHorizontal: 10,
            paddingVertical: 6,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: isConnected ? "#16653440" : "#f9731640",
          }}>
            <View style={{
              width: 6, height: 6, borderRadius: 3,
              backgroundColor: isConnected ? "#4ade80" : "#f97316",
              // green dot for live, amber for offline
            }} />
            <Text style={{
              fontSize: 10,
              fontWeight: "700",
              color: isConnected ? "#4ade80" : "#f97316",
            }}>
              {isConnected ? "LIVE" : "OFFLINE"}
            </Text>
          </View>
        </View>

        {/* Health Score */}
        <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
          <View style={{
            backgroundColor: "#0d1b2a",
            borderRadius: 18,
            padding: 20,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            borderWidth: 1,
            borderColor: "#1e3a5f",
          }}>
            <View>
              <Text style={{ fontSize: 10, color: "#64748b", letterSpacing: 1, textTransform: "uppercase" }}>
                Health Score
              </Text>
              <Text style={{ fontSize: 13, color: "#94a3b8", marginTop: 4, maxWidth: 180 }}>
                {latestVitals
                  ? "Based on all your current vitals"
                  : "Connect your device to see your score"}
              </Text>
              <Text style={{ fontSize: 11, color: "#475569", marginTop: 8 }}>
                Last updated: {latestVitals
                  ? new Date(latestVitals.createdAt).toLocaleTimeString()
                  : "Never"}
              </Text>
            </View>
            <HealthScoreRing score={latestVitals?.healthScore ?? null} size={90} />
          </View>
        </View>

        {/* Vitals Grid */}
        <View style={{ paddingHorizontal: 16 }}>

          {/* Row 1 — Heart rate + SpO2 */}
          <View style={{ flexDirection: "row", gap: 10, marginBottom: 10 }}>
            <VitalCard
              icon="❤️"
              label="Heart Rate"
              value={latestVitals?.heartRate ?? null}
              unit="bpm"
              color="#e94560"
              status={getStatus(latestVitals?.heartRate ?? null, 60, 100)}
            />
            <VitalCard
              icon="🫁"
              label="Blood Oxygen"
              value={latestVitals?.spO2 ?? null}
              unit="%"
              color="#60a5fa"
              status={getStatus(latestVitals?.spO2 ?? null, 94, 100)}
            />
          </View>

          {/* Row 2 — Temperature + Humidity */}
          <View style={{ flexDirection: "row", gap: 10, marginBottom: 10 }}>
            <VitalCard
              icon="🌡️"
              label="Body Temp"
              value={latestVitals?.bodyTemperature ?? null}
              unit="°C"
              color="#f97316"
              status={getStatus(latestVitals?.bodyTemperature ?? null, 36.1, 37.5)}
            />
            <VitalCard
              icon="💧"
              label="Humidity"
              value={latestVitals?.roomHumidity ?? null}
              unit="%"
              color="#0f9b8e"
              status={getStatus(latestVitals?.roomHumidity ?? null, 30, 70)}
            />
          </View>

          {/* Row 3 — Respiratory (full width) */}
          <View style={{ marginBottom: 16 }}>
            <VitalCard
              icon="💨"
              label="Respiratory Rate"
              value={latestVitals?.respiratoryRate ?? null}
              unit="/min"
              color="#c084fc"
              status={getStatus(latestVitals?.respiratoryRate ?? null, 12, 20)}
            />
          </View>

        </View>

        {/*  No data state */}
        {!latestVitals && (
          <View style={{
            marginHorizontal: 16,
            backgroundColor: "#0f1923",
            borderRadius: 14,
            padding: 20,
            alignItems: "center",
            borderWidth: 1,
            borderColor: "#1e293b",
            borderStyle: "dashed",
            marginBottom: 16,
          }}>
            <Text style={{ fontSize: 32, marginBottom: 8 }}>📡</Text>
            <Text style={{ color: "#f1f5f9", fontWeight: "700", fontSize: 15 }}>
              No vitals yet
            </Text>
            <Text style={{ color: "#64748b", fontSize: 12, marginTop: 4, textAlign: "center" }}>
              Connect your VitalSync device to start monitoring
            </Text>
          </View>
        )}

        {/* SOS Button  */}
        <View style={{ paddingHorizontal: 16, marginBottom: 32 }}>
          <TouchableOpacity
            onPress={handleSOS}
            disabled={sosLoading}
            style={{
              backgroundColor: "#1a0808",
              borderRadius: 14,
              padding: 16,
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
              borderWidth: 2,
              borderColor: "#e9456060",
            }}
            activeOpacity={0.8}
          >
            <View style={{
              width: 44, height: 44, borderRadius: 12,
              backgroundColor: "#e94560",
              alignItems: "center", justifyContent: "center",
            }}>
              {sosLoading
                ? <ActivityIndicator color="white" size="small" />
                : <Text style={{ fontSize: 20 }}>🆘</Text>}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: "#e94560", fontWeight: "700", fontSize: 14 }}>
                Emergency SOS
              </Text>
              <Text style={{ color: "#64748b", fontSize: 11, marginTop: 2 }}>
                Alerts all caregivers immediately
              </Text>
            </View>
            <Text style={{
              fontSize: 10, color: "#e94560",
              backgroundColor: "#e9456020",
              paddingHorizontal: 8, paddingVertical: 4,
              borderRadius: 6, fontWeight: "700",
            }}>
              HOLD
            </Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </View>
  );
}