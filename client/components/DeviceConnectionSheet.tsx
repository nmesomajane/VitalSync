import React, { useState, useCallback } from "react";
import {
  View, Text, Modal, TouchableOpacity,
   ActivityIndicator, Alert,
 
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { bleManager } from "../src/bluetooth/bleManager";
import useBLEStore from "../src/store/bleStore";
import { Colors } from "../constants/colors";

interface FoundDevice {
  id: string;
  name: string;
  rssi: number;
}

interface Props {
  visible: boolean;
  onClose: () => void;
}

// signal strength label from RSSI value
const getSignalLabel = (rssi: number): { label: string; color: string } => {
  if (rssi >= -60) return { label: "Excellent", color: "#10b981" };
  if (rssi >= -70) return { label: "Good", color: "#3b82f6" };
  if (rssi >= -80) return { label: "Fair", color: "#f59e0b" };
  return { label: "Weak", color: "#ef4444" };
};

// number of signal bars (1-4) from RSSI
const getSignalBars = (rssi: number): number => {
  if (rssi >= -60) return 4;
  if (rssi >= -70) return 3;
  if (rssi >= -80) return 2;
  return 1;
};

export default function DeviceConnectionSheet({ visible, onClose }: Props) {
  const { connectionState, deviceName, errorMessage, packetsReceived } =
    useBLEStore();

  const [foundDevices, setFoundDevices] = useState<FoundDevice[]>([]);
  const [connecting, setConnecting] = useState(false);

  // ── scan ──────────────────────────────────────────────────
  const handleScan = useCallback(async () => {
    setFoundDevices([]);

    await bleManager.scanForDevices((device) => {
      setFoundDevices((prev) => {
        if (prev.find((d) => d.id === device.id)) return prev;
        return [
          ...prev,
          {
            id: device.id,
            name: device.name ?? "VitalSync Device",
            rssi: device.rssi ?? -90,
          },
        ];
      });
    });
  }, []);

  // ── connect ───────────────────────────────────────────────
  const handleConnect = useCallback(async (device: FoundDevice) => {
    setConnecting(true);
    bleManager.stopScan();

    const success = await bleManager.connectToDevice(device);
    setConnecting(false);

    if (success) {
      Alert.alert(
        "Connected ✅",
        `VitalSync is now receiving live data from ${device.name}.\n\nThe dashboard will update automatically with each measurement.`,
        [{ text: "Great!", onPress: onClose }]
      );
    }
  }, [onClose]);

  // ── disconnect ────────────────────────────────────────────
  const handleDisconnect = useCallback(() => {
    Alert.alert(
      "Disconnect Device",
      `Stop receiving data from ${deviceName}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Disconnect",
          style: "destructive",
          onPress: async () => {
            await bleManager.disconnect();
            setFoundDevices([]);
          },
        },
      ]
    );
  }, [deviceName]);

  const isScanning = connectionState === "scanning";
  const isConnected = connectionState === "connected";

  const renderContent = () => {
    // ── connected state ──────────────────────────────────────
    if (isConnected) {
      return (
        <View style={{ gap: 16 }}>
          {/* Device info card */}
          <View style={{
            backgroundColor: "#0d2a1a",
            borderRadius: 16,
            padding: 16,
            borderWidth: 1,
            borderColor: "#16653440",
            flexDirection: "row",
            alignItems: "center",
            gap: 14,
          }}>
            <View style={{
              width: 48, height: 48, borderRadius: 14,
              backgroundColor: "#10b98120",
              alignItems: "center", justifyContent: "center",
            }}>
              <Ionicons name="hardware-chip" size={24} color="#10b981" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: "700", color: "#f9fafb" }}>
                {deviceName ?? "VitalSync-ESP32"}
              </Text>
              <View style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                marginTop: 4,
              }}>
                <View style={{
                  width: 7, height: 7, borderRadius: 3.5,
                  backgroundColor: "#10b981",
                }} />
                <Text style={{ fontSize: 12, color: "#10b981", fontWeight: "600" }}>
                  Streaming live
                </Text>
              </View>
            </View>
            <Ionicons name="bluetooth" size={20} color="#10b981" />
          </View>

          {/* Packets counter */}
          {packetsReceived > 0 && (
            <View style={{
              backgroundColor: Colors.card,
              borderRadius: 12,
              padding: 14,
              borderWidth: 1,
              borderColor: Colors.cardBorder,
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
            }}>
              <Ionicons name="pulse" size={18} color={Colors.primary} />
              <Text style={{ fontSize: 13, color: Colors.textSecondary }}>
                Receiving measurement data...{" "}
                <Text style={{ color: Colors.primary, fontWeight: "700" }}>
                  {packetsReceived}/145 packets
                </Text>
              </Text>
            </View>
          )}

          {/* What data is received */}
          <View style={{
            backgroundColor: Colors.card,
            borderRadius: 14,
            padding: 14,
            borderWidth: 1,
            borderColor: Colors.cardBorder,
          }}>
            <Text style={{
              fontSize: 11, color: Colors.textMuted,
              textTransform: "uppercase", letterSpacing: 0.8,
              fontWeight: "700", marginBottom: 10,
            }}>
              Receiving
            </Text>
            {[
              { icon: "heart", label: "Heart Rate", color: "#ef4444" },
              { icon: "water", label: "Blood Oxygen (SpO₂)", color: "#3b82f6" },
              { icon: "thermometer", label: "Body Temperature", color: "#f97316" },
              { icon: "pulse", label: "ECG Waveform (1000 samples)", color: "#8b5cf6" },
              { icon: "analytics", label: "TinyML Classification", color: "#10b981" },
            ].map((item) => (
              <View
                key={item.label}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 10,
                  paddingVertical: 6,
                }}
              >
                <Ionicons name={item.icon as any} size={16} color={item.color} />
                <Text style={{ fontSize: 13, color: Colors.textSecondary }}>
                  {item.label}
                </Text>
              </View>
            ))}
          </View>

          {/* Disconnect button */}
          <TouchableOpacity
            onPress={handleDisconnect}
            style={{
              borderWidth: 1,
              borderColor: "#ef444440",
              borderRadius: 14,
              padding: 14,
              alignItems: "center",
              backgroundColor: "#1c0a0a",
              flexDirection: "row",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <Ionicons name="bluetooth-outline" size={18} color="#ef4444" />
            <Text style={{ color: "#ef4444", fontWeight: "600", fontSize: 14 }}>
              Disconnect Device
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    // ── scanning / device list state ─────────────────────────
    return (
      <View style={{ gap: 16 }}>
        {/* Instructions */}
        <View style={{
          backgroundColor: `${Colors.primary}10`,
          borderRadius: 12,
          padding: 14,
          borderWidth: 1,
          borderColor: `${Colors.primary}20`,
          flexDirection: "row",
          gap: 10,
        }}>
          <Ionicons name="information-circle-outline" size={18} color={Colors.primary} />
          <Text style={{ fontSize: 12, color: Colors.textSecondary, flex: 1, lineHeight: 18 }}>
            Make sure your VitalSync device is powered on and within 5 metres.
            The device beeps once when ready to connect.
          </Text>
        </View>

        {/* Scan button */}
        <TouchableOpacity
          onPress={handleScan}
          disabled={isScanning || connecting}
          style={{
            backgroundColor: isScanning ? Colors.card : Colors.primary,
            borderRadius: 14,
            padding: 16,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            borderWidth: isScanning ? 1 : 0,
            borderColor: Colors.cardBorder,
          }}
          activeOpacity={0.85}
        >
          {isScanning ? (
            <>
              <ActivityIndicator size="small" color={Colors.primary} />
              <Text style={{ color: Colors.primary, fontWeight: "600", fontSize: 14 }}>
                Scanning...
              </Text>
            </>
          ) : (
            <>
              <Ionicons name="bluetooth" size={18} color="white" />
              <Text style={{ color: "white", fontWeight: "700", fontSize: 14 }}>
                {foundDevices.length > 0 ? "Scan Again" : "Scan for Device"}
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* Error state */}
        {connectionState === "error" && errorMessage && (
          <View style={{
            backgroundColor: "#1c0a0a",
            borderRadius: 12,
            padding: 14,
            borderWidth: 1,
            borderColor: "#ef444430",
            flexDirection: "row",
            gap: 10,
          }}>
            <Ionicons name="alert-circle" size={18} color="#ef4444" />
            <Text style={{ fontSize: 13, color: "#fca5a5", flex: 1, lineHeight: 18 }}>
              {errorMessage}
            </Text>
          </View>
        )}

        {/* Device list */}
        {foundDevices.length > 0 && (
          <View>
            <Text style={{
              fontSize: 11, color: Colors.textMuted,
              textTransform: "uppercase", letterSpacing: 0.8,
              fontWeight: "700", marginBottom: 10,
            }}>
              Devices Found ({foundDevices.length})
            </Text>

            {foundDevices.map((device) => {
              const signal = getSignalLabel(device.rssi);
              const bars = getSignalBars(device.rssi);

              return (
                <TouchableOpacity
                  key={device.id}
                  onPress={() => handleConnect(device)}
                  disabled={connecting}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                    padding: 14,
                    backgroundColor: Colors.card,
                    borderRadius: 14,
                    marginBottom: 8,
                    borderWidth: 1,
                    borderColor: Colors.cardBorder,
                    opacity: connecting ? 0.6 : 1,
                  }}
                  activeOpacity={0.8}
                >
                  {/* Device icon */}
                  <View style={{
                    width: 44, height: 44, borderRadius: 12,
                    backgroundColor: `${Colors.primary}15`,
                    alignItems: "center", justifyContent: "center",
                  }}>
                    <Ionicons
                      name="hardware-chip-outline"
                      size={22}
                      color={Colors.primary}
                    />
                  </View>

                  {/* Device info */}
                  <View style={{ flex: 1 }}>
                    <Text style={{
                      fontSize: 14, fontWeight: "600",
                      color: Colors.textPrimary,
                    }}>
                      {device.name}
                    </Text>
                    <View style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 6,
                      marginTop: 3,
                    }}>
                      {/* Signal bars */}
                      <View style={{ flexDirection: "row", gap: 2, alignItems: "flex-end" }}>
                        {[1, 2, 3, 4].map((bar) => (
                          <View
                            key={bar}
                            style={{
                              width: 3,
                              height: 4 + bar * 2,
                              borderRadius: 1,
                              backgroundColor: bar <= bars ? signal.color : Colors.cardBorder,
                            }}
                          />
                        ))}
                      </View>
                      <Text style={{
                        fontSize: 11,
                        color: signal.color,
                        fontWeight: "600",
                      }}>
                        {signal.label} signal
                      </Text>
                    </View>
                  </View>

                  {/* Connect button or spinner */}
                  {connecting ? (
                    <ActivityIndicator size="small" color={Colors.primary} />
                  ) : (
                    <View style={{
                      backgroundColor: `${Colors.primary}15`,
                      borderRadius: 8,
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderWidth: 1,
                      borderColor: `${Colors.primary}30`,
                    }}>
                      <Text style={{
                        fontSize: 12,
                        color: Colors.primary,
                        fontWeight: "700",
                      }}>
                        Connect
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Empty state after scan */}
        {!isScanning && foundDevices.length === 0 && connectionState !== "error" && (
          <View style={{
            alignItems: "center",
            paddingVertical: 24,
            gap: 8,
          }}>
            <Ionicons
              name="bluetooth-outline"
              size={40}
              color={Colors.textMuted}
            />
            <Text style={{
              fontSize: 14,
              color: Colors.textMuted,
              textAlign: "center",
            }}>
              Tap Scan to search for your VitalSync device
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)" }}
        onPress={onClose}
        activeOpacity={1}
      >
        <View style={{
          position: "absolute",
          bottom: 0, left: 0, right: 0,
          backgroundColor: Colors.background,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          paddingHorizontal: 20,
          paddingBottom: 40,
          maxHeight: "85%",
        }}>
          <TouchableOpacity activeOpacity={1}>
            {/* Handle */}
            <View style={{
              width: 40, height: 4, borderRadius: 2,
              backgroundColor: Colors.cardBorder,
              alignSelf: "center",
              marginTop: 12, marginBottom: 20,
            }} />

            {/* Header */}
            <View style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 20,
            }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <Ionicons name="bluetooth" size={20} color={Colors.primary} />
                <Text style={{ fontSize: 18, fontWeight: "700", color: Colors.textPrimary }}>
                  {isConnected ? "Device Connected" : "Connect Device"}
                </Text>
              </View>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={22} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            {renderContent()}
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}