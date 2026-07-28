import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useHistory } from "../../hooks/useHistory";
import MetricSelector from "../../components/MetricSelector";
import HistoryChart from "../../components/HistoryChart";
import SummaryCard from "../../components/SummaryCard";
import AlertListItem from "../../components/AlertListItem";
import { Colors } from "../../constants/colors";
import useVitalsStore from "../../src/store/vitalsStore";
import { Share } from "react-native";
import { generatePublicShareToken } from "../../src/services/history";

// time range options for the toggle buttons at the top
const TIME_RANGES: { label: string; days: number }[] = [
  { label: "7D", days: 7 },
  { label: "30D", days: 30 },
  { label: "3M", days: 90 },
];

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const [shareLoading, setShareLoading] = useState(false);

  const handleShare = async () => {
    setShareLoading(true);
    try {
      const { shareUrl, expiresAt } = await generatePublicShareToken();
      // one API call — no caregiver needed

      await Share.share({
        title: "My VitalSync Health Data",
        message:
          `View my live health vitals on VitalSync:\n\n${shareUrl}\n\n` +
          `This link expires on ${new Date(expiresAt).toLocaleDateString(
            "en-GB",
            {
              day: "numeric",
              month: "long",
              year: "numeric",
            },
          )}.\n\nShared from VitalSync Health Monitoring App.`,
      });

      console.log("Share sheet opened successfully");
    } catch (err) {
      console.error("Share failed:", err);
      Alert.alert(
        "Share Failed",
        "Could not generate share link. Check your connection.",
      );
    } finally {
      setShareLoading(false);
    }
  };

  const {
    chartData,
    summary,
    alerts,
    onAcknowledge,
    selectedMetric,
    setSelectedMetric,
    selectedDays,
    setSelectedDays,
    isLoading,
    isRefreshing,
    error,
    refresh,
  } = useHistory();

  const { unreadAlertCount } = useVitalsStore();

  const [activeTab, setActiveTab] = useState<"vitals" | "alerts">("vitals");

  console.log("HistoryScreen rendered — activeTab:", activeTab);

  //  loading state
  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: Colors.background,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text
          style={{ color: Colors.textSecondary, marginTop: 12, fontSize: 14 }}
        >
          Loading health history...
        </Text>
      </View>
    );
  }

  //  error state
  if (error) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: Colors.background,
          justifyContent: "center",
          alignItems: "center",
          padding: 24,
        }}
      >
        <Ionicons
          name="cloud-offline-outline"
          size={48}
          color={Colors.textMuted}
        />
        <Text
          style={{
            color: Colors.textPrimary,
            fontSize: 16,
            fontWeight: "700",
            marginTop: 16,
          }}
        >
          Could not load history
        </Text>
        <Text
          style={{
            color: Colors.textSecondary,
            fontSize: 13,
            marginTop: 8,
            textAlign: "center",
          }}
        >
          {error}
        </Text>
        <TouchableOpacity
          onPress={refresh}
          style={{
            marginTop: 20,
            backgroundColor: Colors.primary,
            borderRadius: 12,
            paddingVertical: 12,
            paddingHorizontal: 24,
          }}
        >
          <Text style={{ color: "white", fontWeight: "700" }}>Retry</Text>
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
            refreshing={isRefreshing}
            onRefresh={refresh}
            tintColor={Colors.primary}
          />
        }
      >
        {/*  Header  */}
        <View
          style={{
            paddingTop: insets.top + 12,
            paddingHorizontal: 20,
            paddingBottom: 16,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <View>
            <Text
              style={{
                fontSize: 22,
                fontWeight: "700",
                color: Colors.textPrimary,
              }}
            >
              Health History
            </Text>

            <Text
              style={{
                fontSize: 13,
                color: Colors.textSecondary,
                marginTop: 2,
              }}
            >
              {summary
                ? `${summary.daysAnalysed ?? selectedDays} days · ${summary.totalReadings?.toLocaleString() ?? 0} readings`
                : "No data yet"}
            </Text>
          </View>

          {/* Share button */}
          <TouchableOpacity
            onPress={handleShare}
            disabled={shareLoading}
            style={{
              width: 38,
              height: 38,
              backgroundColor: Colors.card,
              borderRadius: 11,
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1,
              borderColor: Colors.cardBorder,
            }}
          >
            {shareLoading ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              <Ionicons
                name="share-outline"
                size={18}
                color={Colors.textSecondary}
              />
            )}
          </TouchableOpacity>
        </View>

        {/* Tab switcher: Vitals / Alerts*/}
        <View
          style={{
            flexDirection: "row",
            marginHorizontal: 16,
            marginBottom: 20,
            backgroundColor: Colors.card,
            borderRadius: 12,
            padding: 4,
            borderWidth: 1,
            borderColor: Colors.cardBorder,
          }}
        >
          {(["vitals", "alerts"] as const).map((tab) => {
            const isActive = activeTab === tab;
            const showBadge = tab === "alerts" && unreadAlertCount > 0;

            return (
              <TouchableOpacity
                key={tab}
                onPress={() => {
                  console.log("HistoryScreen: switching to tab:", tab);
                  setActiveTab(tab);
                }}
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  borderRadius: 10,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: isActive ? Colors.primary : "transparent",

                  flexDirection: "row",
                  gap: 6,
                }}
                activeOpacity={0.8}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "600",
                    color: isActive ? "white" : Colors.textMuted,
                    textTransform: "capitalize",
                    // "vitals" → "Vitals", "alerts" → "Alerts"
                  }}
                >
                  {tab}
                </Text>

                {/* Unread badge on Alerts tab */}
                {showBadge && (
                  <View
                    style={{
                      backgroundColor: isActive ? "white" : Colors.danger,
                      borderRadius: 8,
                      minWidth: 18,
                      height: 18,
                      alignItems: "center",
                      justifyContent: "center",
                      paddingHorizontal: 4,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 10,
                        fontWeight: "700",
                        color: isActive ? Colors.danger : "white",
                        // inverted colors when active (white tab, red badge)
                      }}
                    >
                      {unreadAlertCount > 9 ? "9+" : unreadAlertCount}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* VITALS TAB  */}
        {activeTab === "vitals" && (
          <>
            {/* Time range buttons */}
            <View
              style={{
                flexDirection: "row",
                paddingHorizontal: 16,
                gap: 8,
                marginBottom: 16,
              }}
            >
              {TIME_RANGES.map(({ label, days }) => {
                const isActive = selectedDays === days;
                return (
                  <TouchableOpacity
                    key={days}
                    onPress={() => {
                      console.log("HistoryScreen: changing to", days, "days");
                      setSelectedDays(days);
                      // hook re-fetches automatically when days changes
                    }}
                    style={{
                      paddingHorizontal: 16,
                      paddingVertical: 7,
                      borderRadius: 8,
                      backgroundColor: isActive ? Colors.primary : Colors.card,
                      borderWidth: 1,
                      borderColor: isActive
                        ? Colors.primary
                        : Colors.cardBorder,
                    }}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: "700",
                        color: isActive ? "white" : Colors.textMuted,
                      }}
                    >
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Metric selector pills */}
            <MetricSelector
              selected={selectedMetric}
              onSelect={setSelectedMetric}
            />

            {/* Bar chart */}
            <HistoryChart
              data={chartData}
              selectedMetric={selectedMetric}
              selectedDays={selectedDays}
            />

            {/* Summary cards */}
            {summary && (
              <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: "700",
                    color: Colors.textMuted,
                    letterSpacing: 1,
                    textTransform: "uppercase",
                    marginBottom: 10,
                  }}
                >
                  {selectedDays}D Summary
                </Text>

                {/* Row 1 — Heart rate + SpO₂ */}
                <View
                  style={{ flexDirection: "row", gap: 10, marginBottom: 10 }}
                >
                  <SummaryCard
                    icon="heart-outline"
                    label="Avg Heart Rate"
                    value={summary.avgHeartRate?.toFixed(1) ?? "--"}
                    unit="bpm"
                    color={Colors.heartRate}
                  />
                  <SummaryCard
                    icon="water-outline"
                    label="Avg SpO₂"
                    value={summary.avgSpO2?.toFixed(1) ?? "--"}
                    unit="%"
                    color={Colors.spO2}
                  />
                </View>

                {/* Row 2 — Temperature + Respiratory */}
                <View
                  style={{ flexDirection: "row", gap: 10, marginBottom: 10 }}
                >
                  <SummaryCard
                    icon="thermometer-outline"
                    label="Avg Temp"
                    value={summary.avgBodyTemperature?.toFixed(1) ?? "--"}
                    unit="°C"
                    color={Colors.temperature}
                  />
                  <SummaryCard
                    icon="pulse-outline"
                    label="Avg Respiratory"
                    value={summary.avgRespiratoryRate?.toFixed(1) ?? "--"}
                    unit="/min"
                    color="#8b5cf6"
                  />
                </View>

                {/* Row 3 — Readings + Anomalies */}
                <View style={{ flexDirection: "row", gap: 10 }}>
                  <SummaryCard
                    icon="analytics-outline"
                    label="Total Readings"
                    value={summary.totalReadings.toLocaleString()}
                    color={Colors.primary}
                  />
                  <SummaryCard
                    icon="warning-outline"
                    label="Anomalies"
                    value={`${summary.totalAnomalies}`}
                    unit={summary.totalAnomalies === 1 ? "event" : "events"}
                    color={Colors.warning}
                    highlight={summary.totalAnomalies > 0}
                    // highlight = amber tinted background when anomalies exist
                  />
                </View>
              </View>
            )}
          </>
        )}

        {/* ── ALERTS TAB ────────────────────────────────────── */}
        {activeTab === "alerts" && (
          <View style={{ paddingHorizontal: 16 }}>
            {alerts.length === 0 ? (
              // empty state — no alerts recorded
              <View
                style={{
                  backgroundColor: Colors.card,
                  borderRadius: 16,
                  padding: 32,
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: Colors.cardBorder,
                  borderStyle: "dashed",
                  gap: 8,
                }}
              >
                <Ionicons
                  name="checkmark-circle-outline"
                  size={40}
                  color={Colors.success}
                />
                <Text
                  style={{
                    color: Colors.textPrimary,
                    fontWeight: "700",
                    fontSize: 15,
                  }}
                >
                  No alerts
                </Text>
                <Text
                  style={{
                    color: Colors.textSecondary,
                    fontSize: 13,
                    textAlign: "center",
                  }}
                >
                  All vitals have been within normal ranges
                </Text>
              </View>
            ) : (
              // render each alert
              alerts.map((alert) => (
                <AlertListItem
                  key={alert.id}
                  // key must be unique — alert id works perfectly
                  alert={alert}
                  onAcknowledge={onAcknowledge}
                />
              ))
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
