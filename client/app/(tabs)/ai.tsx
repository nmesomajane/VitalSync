import React from "react";
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
import { useAI } from "../../hooks/useAI";
import ConsentGate from "../../components/ConsentGate";
import PatternCard from "../../components/PatternCard";
import MealPlanCard from "../../components/MealPlanCard";
import RoutineCard from "../../components/RoutineCard";
import VideoCard from "../../components/VideoCard";
import { Colors } from "../../constants/colors";

export default function AIScreen() {
  const insets = useSafeAreaInsets();

  const {
    hasConsent,
    isConsentLoading,
    onGiveConsent,
    onRevokeConsent,
    suggestions,
    parsedSuggestions,
    isLoading,
    isRefreshing,
    error,
    refresh,
  } = useAI();

  console.log(
    "AIScreen rendered — consent:",
    hasConsent,
    "hasData:",
    !!suggestions
  );

  // ── checking consent ──────────────────────────────────────
  // show spinner while we fetch the user's consent status
  // prevents the consent gate flashing before we know the truth
  if (isConsentLoading) {
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
      </View>
    );
  }

  // ── consent gate ──────────────────────────────────────────
  // show the consent explanation if user hasn't opted in yet
  if (!hasConsent) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: Colors.background,
          paddingTop: insets.top,
        }}
      >
        {/* Header — visible even without consent */}
        <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 }}>
          <Text
            style={{
              fontSize: 22,
              fontWeight: "700",
              color: Colors.textPrimary,
            }}
          >
            AI Insights
          </Text>
        </View>

        {/* The consent gate component */}
        <ConsentGate onConsent={onGiveConsent} />
      </View>
    );
  }

  // ── loading AI suggestions ────────────────────────────────
  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: Colors.background,
          justifyContent: "center",
          alignItems: "center",
          gap: 12,
        }}
      >
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={{ color: Colors.textSecondary, fontSize: 14 }}>
          Analysing your vitals...
        </Text>
        <Text style={{ color: Colors.textMuted, fontSize: 12, textAlign: "center", paddingHorizontal: 40 }}>
          Gemini is generating personalised recommendations from your health data
        </Text>
      </View>
    );
  }

  // ── error state ───────────────────────────────────────────
  if (error && !suggestions) {
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
        <Ionicons name="cloud-offline-outline" size={48} color={Colors.textMuted} />
        <Text
          style={{
            color: Colors.textPrimary,
            fontSize: 16,
            fontWeight: "700",
            marginTop: 16,
            textAlign: "center",
          }}
        >
          Could not load insights
        </Text>
        <Text
          style={{
            color: Colors.textSecondary,
            fontSize: 13,
            marginTop: 8,
            textAlign: "center",
            lineHeight: 20,
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
          <Text style={{ color: "white", fontWeight: "700" }}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── handle revoke consent confirmation ────────────────────
  const handleRevokeConsent = () => {
    Alert.alert(
      "Disable AI Features",
      "Your vitals will no longer be sent to Gemini AI. All other features will continue working normally.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Disable",
          style: "destructive",
          onPress: async () => {
            console.log("AIScreen: user revoking consent");
            await onRevokeConsent();
          },
        },
      ]
    );
  };

  // ── main content ──────────────────────────────────────────
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

        {/* ── Header ────────────────────────────────────────── */}
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
              AI Insights
            </Text>
            {suggestions?.generatedAt && (
              <Text
                style={{
                  fontSize: 12,
                  color: Colors.textMuted,
                  marginTop: 3,
                }}
              >
                Generated{" "}
                {new Date(suggestions.generatedAt).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
            )}
          </View>

          {/* Settings / revoke consent button */}
          <TouchableOpacity
            onPress={handleRevokeConsent}
            style={{
              width: 36,
              height: 36,
              backgroundColor: Colors.card,
              borderRadius: 10,
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1,
              borderColor: Colors.cardBorder,
            }}
          >
            <Ionicons
              name="settings-outline"
              size={17}
              color={Colors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        {/* ── Health Pattern Card ────────────────────────────── */}
        {suggestions && (
          <PatternCard
            pattern={suggestions.pattern}
            vitalsContext={suggestions.vitalsContext}
            generatedAt={suggestions.generatedAt}
          />
        )}

        {/* ── Meal Plan ─────────────────────────────────────── */}
        {parsedSuggestions && (
          <MealPlanCard mealPlan={parsedSuggestions.mealPlan} />
        )}

        {/* ── Daily Routine + Warnings ──────────────────────── */}
        {parsedSuggestions && (
          <RoutineCard
            routine={parsedSuggestions.routine}
            warnings={parsedSuggestions.warnings}
          />
        )}

        {/* ── YouTube Videos ────────────────────────────────── */}
        {suggestions?.videos && suggestions.videos.length > 0 && (
          <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                marginBottom: 12,
              }}
            >
              <Ionicons name="logo-youtube" size={18} color="#ef4444" />
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: "700",
                  color: Colors.textPrimary,
                }}
              >
                Recommended Videos
              </Text>
            </View>

            <Text
              style={{
                fontSize: 12,
                color: Colors.textMuted,
                marginBottom: 12,
                lineHeight: 17,
              }}
            >
              Selected based on your health pattern. Tap to watch on YouTube.
            </Text>

            {suggestions.videos.map((video) => (
              <VideoCard key={video.videoId} video={video} />
              // key = videoId ensures React correctly updates
              // when the video list changes
            ))}
          </View>
        )}

        {/* ── Next refresh info ─────────────────────────────── */}
        {suggestions?.nextRefreshAt && (
          <View
            style={{
              marginHorizontal: 16,
              backgroundColor: `${Colors.primary}08`,
              borderRadius: 12,
              padding: 12,
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              borderWidth: 1,
              borderColor: `${Colors.primary}15`,
            }}
          >
            <Ionicons
              name="time-outline"
              size={14}
              color={Colors.primary}
            />
            <Text style={{ fontSize: 11, color: Colors.textSecondary, flex: 1 }}>
              Insights refresh every 6 hours or when your vitals change significantly.
              Next update:{" "}
              {new Date(suggestions.nextRefreshAt).toLocaleTimeString("en-GB", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
          </View>
        )}

      </ScrollView>
    </View>
  );
}