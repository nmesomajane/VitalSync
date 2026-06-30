import React, { useState } from "react";
import {
  View, Text, ScrollView,
  TouchableOpacity, ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useSocket } from "../../hooks/useSocket";
import { useECG } from "../../hooks/useECG";
import ECGChart from "../../components/ECGChart";
import RhythmBadge from "../../components/RhythmBadge";
import { Colors } from "../../constants/colors";

export default function ECGScreen() {
  const insets = useSafeAreaInsets();


  const socket = useSocket();
  // get the socket instance from the hook


  const {
    waveformData,
    analysis,
    recordedAt,
    hasAnomaly,
    isLoading,
    isLive,
    error,
    refresh,
  } = useECG(socket);

 

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    // calls loadStoredECG from the hook
    setRefreshing(false);
  };

  //loading state 
  if (isLoading) {
    return (
      <View style={{
        flex: 1,
        backgroundColor: Colors.background,
        justifyContent: "center",
        alignItems: "center",
      }}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={{
          color: Colors.textSecondary,
          marginTop: 12,
          fontSize: 14,
        }}>
          Loading ECG data...
        </Text>
      </View>
    );
  }

  // error state 
  if (error) {
    return (
      <View style={{
        flex: 1,
        backgroundColor: Colors.background,
        justifyContent: "center",
        alignItems: "center",
        padding: 24,
      }}>
        <Ionicons name="wifi-outline" size={48} color={Colors.textMuted} />
        <Text style={{
          color: Colors.textPrimary,
          fontSize: 16,
          fontWeight: "700",
          marginTop: 16,
          textAlign: "center",
        }}>
          Could not load ECG
        </Text>
        <Text style={{
          color: Colors.textSecondary,
          fontSize: 13,
          marginTop: 8,
          textAlign: "center",
          lineHeight: 20,
        }}>
          {error}
        </Text>
        <TouchableOpacity
          onPress={refresh}
          style={{
            marginTop: 24,
            backgroundColor: Colors.primary,
            borderRadius: 12,
            paddingVertical: 12,
            paddingHorizontal: 24,
          }}
        >
          <Text style={{ color: "white", fontWeight: "700", fontSize: 14 }}>
            Try Again
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
          />
        }
      >

        {/*  Header */}
        <View style={{
          paddingTop: insets.top + 12,
          paddingHorizontal: 20,
          paddingBottom: 16,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}>
          <View>
            <Text style={{
              fontSize: 22,
              fontWeight: "700",
              color: Colors.textPrimary,
            }}>
              ECG Monitor
            </Text>
            <Text style={{ fontSize: 13, color: Colors.textSecondary, marginTop: 2 }}>
              {recordedAt
                ? `Last recorded: ${new Date(recordedAt).toLocaleTimeString()}`
                : "No recording yet"}
            </Text>
          </View>

          {/* Live indicator */}
          <View style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 5,
            backgroundColor: isLive ? "#10b98115" : `${Colors.primary}15`,
            paddingHorizontal: 10,
            paddingVertical: 5,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: isLive ? "#10b98130" : `${Colors.primary}30`,
          }}>
            <View style={{
              width: 6, height: 6, borderRadius: 3,
              backgroundColor: isLive ? "#10b981" : Colors.primary,
            }} />
            <Text style={{
              fontSize: 10,
              fontWeight: "700",
              color: isLive ? "#10b981" : Colors.primary,
              letterSpacing: 0.5,
            }}>
              {isLive ? "STREAMING" : "STORED"}
           
            </Text>
          </View>
        </View>

        {/*  Rhythm Badge */}
        {analysis ? (
          <RhythmBadge
            status={analysis.rhythmStatus}
            message={analysis.message}
            isLive={isLive}
          />
        ) : (
       
          <View style={{
            marginHorizontal: 16,
            marginBottom: 16,
            backgroundColor: Colors.card,
            borderRadius: 14,
            padding: 14,
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            borderWidth: 1,
            borderColor: Colors.cardBorder,
          }}>
            <Ionicons name="pulse-outline" size={22} color={Colors.textMuted} />
            <Text style={{ color: Colors.textMuted, fontSize: 13 }}>
              No rhythm analysis available yet
            </Text>
          </View>
        )}

        {/*  ECG Chart*/}
        <ECGChart
          data={waveformData}
          isLive={isLive}
          hasAnomaly={hasAnomaly}
        />

        {/*Metrics Row */}
        {analysis && (
          <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
            <Text style={{
              fontSize: 11,
              fontWeight: "700",
              color: Colors.textMuted,
              letterSpacing: 1,
              textTransform: "uppercase",
              marginBottom: 10,
            }}>
              Analysis Metrics
            </Text>

            <View style={{ flexDirection: "row", gap: 10 }}>

              {/* Heart rate from ECG */}
              <MetricCard
                icon="heart-outline"
                label="ECG Heart Rate"
                value={analysis.derivedHeartRate
                  ? `${analysis.derivedHeartRate}`
                  : "--"}
                unit="bpm"
                color={Colors.heartRate}
              />

              {/* HRV */}
              <MetricCard
                icon="analytics-outline"
                label="HRV"
                value={analysis.hrv ? `${analysis.hrv}` : "--"}
                unit="ms"
                color={Colors.primary}
              />

              {/* Beat count */}
              <MetricCard
                icon="pulse-outline"
                label="Beats"
                value={analysis.peakCount ? `${analysis.peakCount}` : "--"}
                unit="peaks"
                color="#8b5cf6"
              />

            </View>
          </View>
        )}

        {/* RR Intervals  */}
        {analysis?.rrIntervals && analysis.rrIntervals.length > 0 && (
          <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
            <Text style={{
              fontSize: 11,
              fontWeight: "700",
              color: Colors.textMuted,
              letterSpacing: 1,
              textTransform: "uppercase",
              marginBottom: 10,
            }}>
              RR Intervals (ms)
            </Text>

            <Text style={{
              fontSize: 11,
              color: Colors.textMuted,
              marginBottom: 8,
              lineHeight: 16,
            }}>
              Time between consecutive heartbeats.
              Consistent values indicate regular rhythm.
            </Text>

            <View style={{
              backgroundColor: Colors.card,
              borderRadius: 12,
              padding: 12,
              borderWidth: 1,
              borderColor: Colors.cardBorder,
            }}>
              {/* horizontal scroll for RR interval values */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
              >
                <View style={{ flexDirection: "row", gap: 8 }}>
                  {analysis.rrIntervals.slice(0, 10).map((rr, index) => (
                    
                    <View
                      key={index}
                      style={{
                        backgroundColor: Colors.background,
                        borderRadius: 8,
                        padding: 10,
                        alignItems: "center",
                        minWidth: 56,
                        borderWidth: 1,
                        borderColor: Colors.cardBorder,
                      }}
                    >
                      <Text style={{
                        fontSize: 9,
                        color: Colors.textMuted,
                        marginBottom: 4,
                        letterSpacing: 0.3,
                      }}>
                        R{index + 1}–R{index + 2}
                      
                      </Text>
                      <Text style={{
                        fontSize: 15,
                        fontWeight: "700",
                        color: Colors.textPrimary,
                      }}>
                        {rr}
                      </Text>
                    </View>
                  ))}
                </View>
              </ScrollView>
            </View>
          </View>
        )}

        {/*  What is ECG section */}
        <View style={{
          marginHorizontal: 16,
          backgroundColor: `${Colors.primary}10`,
          borderRadius: 14,
          padding: 16,
          borderWidth: 1,
          borderColor: `${Colors.primary}20`,
        }}>
          <View style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            marginBottom: 8,
          }}>
            <Ionicons
              name="information-circle-outline"
              size={18}
              color={Colors.primary}
            />
            <Text style={{
              fontSize: 13,
              fontWeight: "700",
              color: Colors.primary,
            }}>
              About ECG Monitoring
            </Text>
          </View>
          <Text style={{
            fontSize: 12,
            color: Colors.textSecondary,
            lineHeight: 18,
          }}>
            An electrocardiogram (ECG) records the electrical activity of your
            heart. Each spike in the waveform represents one heartbeat.
            VitalSync analyses the peaks, intervals, and rhythm to detect
            potential arrhythmias. Always consult a doctor for clinical diagnosis.
          </Text>
        </View>

      </ScrollView>
    </View>
  );
}

// MetricCard — local component 
// defined at the bottom of this file because it's only used here
// small enough that it doesn't need its own file

interface MetricCardProps {
  icon: string;
  label: string;
  value: string;
  unit: string;
  color: string;
}

function MetricCard({ icon, label, value, unit, color }: MetricCardProps) {
  return (
    <View style={{
      flex: 1,
      // flex: 1 makes all three cards equal width in the row
      backgroundColor: Colors.card,
      borderRadius: 12,
      padding: 12,
      alignItems: "center",
      borderWidth: 1,
      borderColor: Colors.cardBorder,
      gap: 6,
    }}>
      <Ionicons name={icon as any} size={18} color={color} />
      <Text style={{
        fontSize: 9,
        color: Colors.textMuted,
        letterSpacing: 0.5,
        textTransform: "uppercase",
        textAlign: "center",
      }}>
        {label}
      </Text>
      <View style={{ flexDirection: "row", alignItems: "baseline", gap: 2 }}>
        <Text style={{
          fontSize: 20,
          fontWeight: "800",
          color: Colors.textPrimary,
        }}>
          {value}
        </Text>
        <Text style={{ fontSize: 10, color: Colors.textMuted }}>
          {unit}
        </Text>
      </View>
    </View>
  );
}