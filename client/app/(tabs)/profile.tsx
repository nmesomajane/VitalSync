import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
  Switch,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as SecureStore from "expo-secure-store";
import { router } from "expo-router";
import useAuthStore from "../../src/store/authStore";
import { Colors } from "../../constants/colors";
import {
  fetchProfile,
  fetchMedications,
  fetchCaregivers,
  addMedication,
  deleteMedication,
  toggleMedicationReminder,
  addCaregiver,
  removeCaregiver,
  UserProfile,
  Medication,
  Caregiver,
} from "../../src/services/profile";
import {
  scheduleMedicationReminder,
  cancelMedicationReminder,
  requestNotificationPermission,
} from "../../src/services/notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface AddMedModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (data: Partial<Medication>) => Promise<void>;
}

function AddMedModal({ visible, onClose, onAdd }: AddMedModalProps) {
  const [name, setName] = useState("");
  const [dosage, setDosage] = useState("");
  const [time, setTime] = useState("08:00");
  const [loading, setLoading] = useState(false);

  const handleAdd = async () => {
    if (!name.trim() || !dosage.trim()) {
      Alert.alert("Required", "Please enter medication name and dosage.");
      return;
    }

    // validate time format HH:MM
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timeRegex.test(time)) {
      Alert.alert("Invalid Time", "Enter time in HH:MM format e.g. 08:00");
      return;
    }

    setLoading(true);
    try {
      await onAdd({
        name: name.trim(),
        dosage: dosage.trim(),
        frequency: "once_daily",
        scheduledTimes: [time],
        startDate: new Date().toISOString().split("T")[0],
        // "2024-07-14" format — DATEONLY in Sequelize
      });
      setName("");
      setDosage("");
      setTime("08:00");
      onClose();
    } catch (err) {
      Alert.alert("Failed", "Could not add medication. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      // "slide" = modal slides up from bottom — standard for forms
    >
      <View
        style={{
          flex: 1,
          justifyContent: "flex-end",
          backgroundColor: "rgba(0,0,0,0.6)",
        }}
      >
        <View
          style={{
            backgroundColor: Colors.card,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            padding: 24,
            gap: 16,
          }}
        >
          {/* Handle bar — signals this is a bottom sheet */}
          <View
            style={{
              width: 40,
              height: 4,
              borderRadius: 2,
              backgroundColor: Colors.cardBorder,
              alignSelf: "center",
              marginBottom: 4,
            }}
          />

          <Text
            style={{
              fontSize: 18,
              fontWeight: "700",
              color: Colors.textPrimary,
            }}
          >
            Add Medication
          </Text>

          {/* Name */}
          <View>
            <Text
              style={{
                fontSize: 11,
                color: Colors.textMuted,
                marginBottom: 6,
                textTransform: "uppercase",
                letterSpacing: 0.8,
              }}
            >
              Medication Name
            </Text>
            <TextInput
              style={{
                backgroundColor: Colors.background,
                borderRadius: 12,
                padding: 13,
                color: Colors.textPrimary,
                borderWidth: 1,
                borderColor: Colors.cardBorder,
                fontSize: 15,
              }}
              placeholder="e.g. Aspirin"
              placeholderTextColor={Colors.textMuted}
              value={name}
              onChangeText={setName}
            />
          </View>

          {/* Dosage */}
          <View>
            <Text
              style={{
                fontSize: 11,
                color: Colors.textMuted,
                marginBottom: 6,
                textTransform: "uppercase",
                letterSpacing: 0.8,
              }}
            >
              Dosage
            </Text>
            <TextInput
              style={{
                backgroundColor: Colors.background,
                borderRadius: 12,
                padding: 13,
                color: Colors.textPrimary,
                borderWidth: 1,
                borderColor: Colors.cardBorder,
                fontSize: 15,
              }}
              placeholder="e.g. 75mg or 1 tablet"
              placeholderTextColor={Colors.textMuted}
              value={dosage}
              onChangeText={setDosage}
            />
          </View>

          {/* Time */}
          <View>
            <Text
              style={{
                fontSize: 11,
                color: Colors.textMuted,
                marginBottom: 6,
                textTransform: "uppercase",
                letterSpacing: 0.8,
              }}
            >
              Reminder Time (HH:MM)
            </Text>
            <TextInput
              style={{
                backgroundColor: Colors.background,
                borderRadius: 12,
                padding: 13,
                color: Colors.textPrimary,
                borderWidth: 1,
                borderColor: Colors.cardBorder,
                fontSize: 15,
              }}
              placeholder="08:00"
              placeholderTextColor={Colors.textMuted}
              value={time}
              onChangeText={setTime}
              keyboardType="numbers-and-punctuation"
            />
          </View>

          {/* Buttons */}
          <View style={{ flexDirection: "row", gap: 10 }}>
            <TouchableOpacity
              onPress={onClose}
              style={{
                flex: 1,
                backgroundColor: Colors.background,
                borderRadius: 12,
                padding: 14,
                alignItems: "center",
                borderWidth: 1,
                borderColor: Colors.cardBorder,
              }}
            >
              <Text style={{ color: Colors.textSecondary, fontWeight: "600" }}>
                Cancel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleAdd}
              disabled={loading}
              style={{
                flex: 1,
                backgroundColor: Colors.primary,
                borderRadius: 12,
                padding: 14,
                alignItems: "center",
              }}
            >
              {loading ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text style={{ color: "white", fontWeight: "700" }}>Add</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

//  Add Caregiver Modal
interface AddCaregiverModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (data: Partial<Caregiver>) => Promise<void>;
}

function AddCaregiverModal({
  visible,
  onClose,
  onAdd,
}: AddCaregiverModalProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [relationship, setRelationship] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAdd = async () => {
    if (!name.trim() || !phone.trim()) {
      Alert.alert("Required", "Name and phone number are required.");
      return;
    }
    if (!phone.startsWith("+")) {
      Alert.alert(
        "Invalid Phone",
        "Enter phone in international format e.g. +2348012345678",
      );
      return;
    }

    setLoading(true);
    try {
      await onAdd({
        name: name.trim(),
        phoneNumber: phone.trim(),
        relationship: relationship.trim() || undefined,
      });
      setName("");
      setPhone("");
      setRelationship("");
      onClose();
    } catch (err: any) {
      Alert.alert(
        "Failed",
        err.response?.data?.message ?? "Could not add caregiver.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View
        style={{
          flex: 1,
          justifyContent: "flex-end",
          backgroundColor: "rgba(0,0,0,0.6)",
        }}
      >
        <View
          style={{
            backgroundColor: Colors.card,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            padding: 24,
            gap: 16,
          }}
        >
          <View
            style={{
              width: 40,
              height: 4,
              borderRadius: 2,
              backgroundColor: Colors.cardBorder,
              alignSelf: "center",
            }}
          />
          <Text
            style={{
              fontSize: 18,
              fontWeight: "700",
              color: Colors.textPrimary,
            }}
          >
            Add Caregiver
          </Text>

          {[
            {
              label: "Full Name",
              value: name,
              setter: setName,
              placeholder: "Dr. Adaeze",
              keyboard: "default" as const,
            },
            {
              label: "Phone (+international)",
              value: phone,
              setter: setPhone,
              placeholder: "+2348012345678",
              keyboard: "phone-pad" as const,
            },
            {
              label: "Relationship (optional)",
              value: relationship,
              setter: setRelationship,
              placeholder: "Doctor, Mother, etc.",
              keyboard: "default" as const,
            },
          ].map((field) => (
            <View key={field.label}>
              <Text
                style={{
                  fontSize: 11,
                  color: Colors.textMuted,
                  marginBottom: 6,
                  textTransform: "uppercase",
                  letterSpacing: 0.8,
                }}
              >
                {field.label}
              </Text>
              <TextInput
                style={{
                  backgroundColor: Colors.background,
                  borderRadius: 12,
                  padding: 13,
                  color: Colors.textPrimary,
                  borderWidth: 1,
                  borderColor: Colors.cardBorder,
                  fontSize: 15,
                }}
                placeholder={field.placeholder}
                placeholderTextColor={Colors.textMuted}
                value={field.value}
                onChangeText={field.setter}
                keyboardType={field.keyboard}
                autoCapitalize="none"
              />
            </View>
          ))}

          <View style={{ flexDirection: "row", gap: 10 }}>
            <TouchableOpacity
              onPress={onClose}
              style={{
                flex: 1,
                backgroundColor: Colors.background,
                borderRadius: 12,
                padding: 14,
                alignItems: "center",
                borderWidth: 1,
                borderColor: Colors.cardBorder,
              }}
            >
              <Text style={{ color: Colors.textSecondary, fontWeight: "600" }}>
                Cancel
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleAdd}
              disabled={loading}
              style={{
                flex: 1,
                backgroundColor: Colors.primary,
                borderRadius: 12,
                padding: 14,
                alignItems: "center",
              }}
            >
              {loading ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text style={{ color: "white", fontWeight: "700" }}>Add</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ── Section Header ────────────────────────────────────────────
function SectionHeader({
  icon,
  title,
  action,
}: {
  icon: string;
  title: string;
  action?: { label: string; onPress: () => void };
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 12,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <Ionicons name={icon as any} size={16} color={Colors.primary} />
        <Text
          style={{ fontSize: 14, fontWeight: "700", color: Colors.textPrimary }}
        >
          {title}
        </Text>
      </View>
      {action && (
        <TouchableOpacity onPress={action.onPress}>
          <Text
            style={{ fontSize: 13, color: Colors.primary, fontWeight: "600" }}
          >
            {action.label}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// Main Profile Screen
export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((state) => state.user);
  const storeLogout = useAuthStore((state) => state.logout);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [caregivers, setCaregivers] = useState<Caregiver[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showAddMed, setShowAddMed] = useState(false);
  const [showAddCaregiver, setShowAddCaregiver] = useState(false);

  console.log("ProfileScreen rendered");

  //load all profile data
  const loadData = useCallback(async (refresh = false) => {
    if (refresh) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const [profileData, medsData, caregiversData] = await Promise.all([
        fetchProfile(),
        fetchMedications(),
        fetchCaregivers(),
      ]);
      // Promise.all fetches all three simultaneously
      setProfile(profileData);
      setMedications(medsData);
      setCaregivers(caregiversData);
    } catch (err) {
      console.error("ProfileScreen: load failed:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // logout
  const handleLogout = () => {
    Alert.alert("Log Out", "Are you sure you want to log out of VitalSync?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: async () => {
          await storeLogout();
          console.log("Token after logout:", useAuthStore.getState().token);
        },
      },
    ]);
  };

  // medication handlers
  const handleAddMedication = async (data: Partial<Medication>) => {
    const newMed = await addMedication(data);
    setMedications((prev) => [...prev, newMed]);

    // schedule notification for each scheduled time
    if (newMed.reminderEnabled && newMed.scheduledTimes.length > 0) {
      for (const time of newMed.scheduledTimes) {
        const notifId = await scheduleMedicationReminder(
          newMed.id,
          newMed.name,
          newMed.dosage,
          time,
        );
        if (notifId) {
          // save the notification ID so we can cancel it later
          await AsyncStorage.setItem(
            `med_notif_${newMed.id}_${time}`,
            notifId,
            // key format: "med_notif_[medicationId]_[time]"
            // e.g. "med_notif_abc123_08:00"
          );
        }
      }
      console.log("Scheduled reminders for:", newMed.name);
    }
  };

  const handleDeleteMedication = (id: string, name: string) => {
    Alert.alert("Delete Medication", `Remove ${name}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const med = medications.find((m) => m.id === id);
          if (med) {
            // cancel all scheduled notifications for this medication
            for (const time of med.scheduledTimes) {
              const notifId = await AsyncStorage.getItem(
                `med_notif_${id}_${time}`,
              );
              if (notifId) {
                await cancelMedicationReminder(notifId);
                await AsyncStorage.removeItem(`med_notif_${id}_${time}`);
              }
            }
          }
          await deleteMedication(id);
          setMedications((prev) => prev.filter((m) => m.id !== id));
        },
      },
    ]);
  };

  const handleToggleReminder = async (id: string) => {
    const updated = await toggleMedicationReminder(id);
    setMedications(
      (prev) => prev.map((m) => (m.id === id ? updated : m)),
      // update just the changed medication in the list
    );
  };

  // caregiver handlers
  const handleAddCaregiver = async (data: Partial<Caregiver>) => {
    const newCaregiver = await addCaregiver(data);
    setCaregivers((prev) => [...prev, newCaregiver]);
  };

  const handleRemoveCaregiver = (id: string, name: string) => {
    Alert.alert("Remove Caregiver", `Remove ${name} from your caregivers?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          await removeCaregiver(id);
          setCaregivers((prev) => prev.filter((c) => c.id !== id));
        },
      },
    ]);
  };

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
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => loadData(true)}
            tintColor={Colors.primary}
          />
        }
      >
        {/* Profile Header */}
        <View
          style={{
            paddingTop: insets.top + 12,
            paddingHorizontal: 20,
            paddingBottom: 20,
            alignItems: "center",
          }}
        >
          {/* Avatar */}
          <View
            style={{
              width: 72,
              height: 72,
              borderRadius: 22,
              backgroundColor: Colors.primary,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 12,
            }}
          >
            <Text style={{ fontSize: 28, fontWeight: "800", color: "white" }}>
              {(profile?.name ?? user?.name ?? "P").charAt(0).toUpperCase()}
            </Text>
          </View>

          <Text
            style={{
              fontSize: 20,
              fontWeight: "700",
              color: Colors.textPrimary,
            }}
          >
            {profile?.name ?? user?.name ?? "Patient"}
          </Text>
          <Text style={{ fontSize: 13, color: Colors.textMuted, marginTop: 3 }}>
            {profile?.email ?? user?.email}
          </Text>

          {/* Profile details pills */}
          <View
            style={{
              flexDirection: "row",
              gap: 8,
              marginTop: 12,
              flexWrap: "wrap",
              justifyContent: "center",
            }}
          >
            {profile?.age && (
              <View
                style={{
                  backgroundColor: Colors.card,
                  borderRadius: 20,
                  paddingHorizontal: 12,
                  paddingVertical: 5,
                  borderWidth: 1,
                  borderColor: Colors.cardBorder,
                }}
              >
                <Text style={{ fontSize: 12, color: Colors.textSecondary }}>
                  Age {profile.age}
                </Text>
              </View>
            )}
            {profile?.gender && (
              <View
                style={{
                  backgroundColor: Colors.card,
                  borderRadius: 20,
                  paddingHorizontal: 12,
                  paddingVertical: 5,
                  borderWidth: 1,
                  borderColor: Colors.cardBorder,
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    color: Colors.textSecondary,
                    textTransform: "capitalize",
                  }}
                >
                  {profile.gender}
                </Text>
              </View>
            )}
            <View
              style={{
                backgroundColor: `${Colors.primary}15`,
                borderRadius: 20,
                paddingHorizontal: 12,
                paddingVertical: 5,
                borderWidth: 1,
                borderColor: `${Colors.primary}30`,
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  color: Colors.primary,
                  fontWeight: "600",
                }}
              >
                VitalSync Patient
              </Text>
            </View>
          </View>
        </View>

        {/*  Medication Tracker  */}
        <View
          style={{
            marginHorizontal: 16,
            marginBottom: 16,
            backgroundColor: Colors.card,
            borderRadius: 18,
            padding: 16,
            borderWidth: 1,
            borderColor: Colors.cardBorder,
          }}
        >
          <SectionHeader
            icon="medical-outline"
            title="Medication Reminders"
            action={{ label: "+ Add", onPress: () => setShowAddMed(true) }}
          />

          {medications.length === 0 ? (
            <TouchableOpacity
              onPress={() => setShowAddMed(true)}
              style={{
                borderWidth: 1,
                borderColor: Colors.cardBorder,
                borderStyle: "dashed",
                borderRadius: 12,
                padding: 16,
                alignItems: "center",
                gap: 6,
              }}
            >
              <Ionicons
                name="add-circle-outline"
                size={24}
                color={Colors.textMuted}
              />
              <Text style={{ fontSize: 13, color: Colors.textMuted }}>
                No medications added yet
              </Text>
              <Text style={{ fontSize: 11, color: Colors.textMuted }}>
                Tap to add your first medication reminder
              </Text>
            </TouchableOpacity>
          ) : (
            medications.map((med, index) => (
              <View
                key={med.id}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                  paddingVertical: 12,
                  borderTopWidth: index > 0 ? 1 : 0,
                  borderTopColor: Colors.cardBorder,
                }}
              >
                {/* Medication icon */}
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 11,
                    backgroundColor: `${Colors.primary}15`,
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Ionicons name="medical" size={18} color={Colors.primary} />
                </View>

                {/* Medication info */}
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "600",
                      color: Colors.textPrimary,
                    }}
                  >
                    {med.name}
                  </Text>
                  <Text
                    style={{
                      fontSize: 12,
                      color: Colors.textMuted,
                      marginTop: 1,
                    }}
                  >
                    {med.dosage} · {med.scheduledTimes.join(", ")}
                  </Text>
                </View>

                {/* Toggle reminder */}
                <Switch
                  value={med.reminderEnabled}
                  onValueChange={() => handleToggleReminder(med.id)}
                  trackColor={{
                    false: Colors.cardBorder,
                    true: `${Colors.primary}60`,
                  }}
                  thumbColor={
                    med.reminderEnabled ? Colors.primary : Colors.textMuted
                  }
                />

                {/* Delete */}
                <TouchableOpacity
                  onPress={() => handleDeleteMedication(med.id, med.name)}
                  style={{ padding: 4 }}
                >
                  <Ionicons
                    name="trash-outline"
                    size={16}
                    color={Colors.textMuted}
                  />
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        {/*  Caregivers */}
        <View
          style={{
            marginHorizontal: 16,
            marginBottom: 16,
            backgroundColor: Colors.card,
            borderRadius: 18,
            padding: 16,
            borderWidth: 1,
            borderColor: Colors.cardBorder,
          }}
        >
          <SectionHeader
            icon="people-outline"
            title="Caregivers"
            action={{
              label: "+ Add",
              onPress: () => setShowAddCaregiver(true),
            }}
          />

          {caregivers.length === 0 ? (
            <TouchableOpacity
              onPress={() => setShowAddCaregiver(true)}
              style={{
                borderWidth: 1,
                borderColor: Colors.cardBorder,
                borderStyle: "dashed",
                borderRadius: 12,
                padding: 16,
                alignItems: "center",
                gap: 6,
              }}
            >
              <Ionicons
                name="person-add-outline"
                size={24}
                color={Colors.textMuted}
              />
              <Text style={{ fontSize: 13, color: Colors.textMuted }}>
                No caregivers added
              </Text>
              <Text style={{ fontSize: 11, color: Colors.textMuted }}>
                Add a doctor, family member, or friend
              </Text>
            </TouchableOpacity>
          ) : (
            caregivers.map((caregiver, index) => (
              <View
                key={caregiver.id}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                  paddingVertical: 12,
                  borderTopWidth: index > 0 ? 1 : 0,
                  borderTopColor: Colors.cardBorder,
                }}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 11,
                    backgroundColor: `${Colors.success}15`,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: "700",
                      color: Colors.success,
                    }}
                  >
                    {caregiver.name.charAt(0).toUpperCase()}
                  </Text>
                </View>

                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "600",
                      color: Colors.textPrimary,
                    }}
                  >
                    {caregiver.name}
                  </Text>
                  <Text
                    style={{
                      fontSize: 12,
                      color: Colors.textMuted,
                      marginTop: 1,
                    }}
                  >
                    {caregiver.relationship ?? "Caregiver"} ·{" "}
                    {caregiver.phoneNumber}
                  </Text>
                </View>

                <View
                  style={{
                    backgroundColor: caregiver.isActive
                      ? `${Colors.success}15`
                      : Colors.cardBorder,
                    borderRadius: 6,
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 10,
                      fontWeight: "700",
                      color: caregiver.isActive
                        ? Colors.success
                        : Colors.textMuted,
                    }}
                  >
                    {caregiver.isActive ? "ACTIVE" : "MUTED"}
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={() =>
                    handleRemoveCaregiver(caregiver.id, caregiver.name)
                  }
                  style={{ padding: 4 }}
                >
                  <Ionicons
                    name="close-circle-outline"
                    size={18}
                    color={Colors.textMuted}
                  />
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        {/*  App Settings  */}
        <View
          style={{
            marginHorizontal: 16,
            marginBottom: 16,
            backgroundColor: Colors.card,
            borderRadius: 18,
            borderWidth: 1,
            borderColor: Colors.cardBorder,
            overflow: "hidden",
          }}
        >
          {[
            {
              icon: "notifications-outline",
              label: "Notification Settings",
              onPress: () =>
                Alert.alert(
                  "Coming soon",
                  "Notification settings will be available in the next update.",
                ),
            },
            {
              icon: "shield-checkmark-outline",
              label: "Privacy & Data",
              onPress: () =>
                Alert.alert(
                  "Privacy",
                  "Your vitals are stored securely on VitalSync servers. Only statistical averages are shared with AI services, and only with your explicit consent.",
                ),
            },
            {
              icon: "information-circle-outline",
              label: "About VitalSync",
              onPress: () =>
                Alert.alert(
                  "VitalSync",
                  "Real-time IoT health monitoring system.\nVersion 1.0.0\n\nBuilt as a Final Year Project — Electronic Engineering.",
                ),
            },
          ].map((item, index, arr) => (
            <TouchableOpacity
              key={item.label}
              onPress={item.onPress}
              style={{
                flexDirection: "row",
                alignItems: "center",
                padding: 16,
                borderBottomWidth: index < arr.length - 1 ? 1 : 0,
                borderBottomColor: Colors.cardBorder,
              }}
              activeOpacity={0.7}
            >
              <Ionicons
                name={item.icon as any}
                size={18}
                color={Colors.textSecondary}
              />
              <Text
                style={{
                  flex: 1,
                  fontSize: 14,
                  color: Colors.textPrimary,
                  marginLeft: 12,
                }}
              >
                {item.label}
              </Text>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={Colors.textMuted}
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Logout ─ */}
        <TouchableOpacity
          onPress={handleLogout}
          style={{
            marginHorizontal: 16,
            marginBottom: 8,
            backgroundColor: "#1c0a0a",
            borderRadius: 14,
            padding: 16,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            borderWidth: 1,
            borderColor: `${Colors.danger}30`,
          }}
          activeOpacity={0.85}
        >
          <Ionicons name="log-out-outline" size={20} color={Colors.danger} />
          <Text
            style={{ color: Colors.danger, fontWeight: "700", fontSize: 15 }}
          >
            Log Out
          </Text>
        </TouchableOpacity>

        <Text
          style={{
            textAlign: "center",
            fontSize: 11,
            color: Colors.textMuted,
            marginTop: 8,
          }}
        >
          VitalSync · Final Year Project 2026
        </Text>
      </ScrollView>

      {/* Modals */}
      <AddMedModal
        visible={showAddMed}
        onClose={() => setShowAddMed(false)}
        onAdd={handleAddMedication}
      />
      <AddCaregiverModal
        visible={showAddCaregiver}
        onClose={() => setShowAddCaregiver(false)}
        onAdd={handleAddCaregiver}
      />
    </View>
  );
}
