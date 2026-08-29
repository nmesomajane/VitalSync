import { Platform } from "react-native";
import * as Location from "expo-location";
import useBLEStore from "../store/bleStore";
import useVitalsStore from "../store/vitalsStore";
import { decodePacket, VitalsPacket, ClassificationPacket, vitalsToAPIBody } from "./packetDecoder";
import { encodeTimestampBase64 } from "./packetEncoder";
import { BLE_SERVICE_UUID, BLE_CHARACTERISTICS, BLE_DEVICE_NAME, ECG_TOTAL_FRAGMENTS } from "./bleConstants";
import api from "../services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Buffer } from "buffer";

// lazy import — only loads when BLE is actually used
// prevents crash in Expo Go where native module doesn't exist
const getBleManager = async () => {
  try {
    const { BleManager } = await import("react-native-ble-plx");
    return new BleManager();
  } catch  {
    console.log("BLE: react-native-ble-plx not available");
    return null;
  }
};

interface MeasurementSession {
  vitals: VitalsPacket | null;
  classification: ClassificationPacket | null;
  ecgFragments: Map<number, any>;
}

class VitalSyncBLEManager {
  private ble: any = null;
  private device: any = null;
  private session: MeasurementSession = {
    vitals: null,
    classification: null,
    ecgFragments: new Map(),
  };
  private offlineQueue: any[] = [];
  private scanTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.loadOfflineQueue();
  }

  // ── initialise BLE manager lazily ─────────────────────────
  private ensureManager(): boolean {
    if (this.ble) return true;
    this.ble = getBleManager();
    return this.ble !== null;
  }

  // ── request permissions ───────────────────────────────────
  async requestPermissions(): Promise<boolean> {
    if (Platform.OS !== "android") return true;

    const { status } = await Location.requestForegroundPermissionsAsync();
    // Android requires location permission for BLE scanning
    // this is a Google policy — not something we can bypass
    if (status !== "granted") {
      console.log("BLE: location permission denied");
      useBLEStore.getState().setError(
        "Location permission required to scan for Bluetooth devices. Please enable it in Settings."
      );
      return false;
    }

    console.log("BLE: permissions granted");
    return true;
  }

  // ── scan for VitalSync device ─────────────────────────────
  async startScan(): Promise<void> {
    if (!this.ensureManager()) {
      useBLEStore.getState().setError(
        "Bluetooth not available. Make sure this is a development build, not Expo Go."
      );
      return;
    }

    const hasPermission = await this.requestPermissions();
    if (!hasPermission) return;

    const bleStore = useBLEStore.getState();
    bleStore.setConnectionState("scanning");

    console.log("BLE: starting scan for", BLE_DEVICE_NAME);

    // check Bluetooth is on
    const state = await this.ble.state();
    if (state !== "PoweredOn") {
      bleStore.setError(
        "Bluetooth is turned off. Please enable Bluetooth and try again."
      );
      return;
    }

    this.ble.startDeviceScan(
      null,
      // null = scan all services — find by name instead
      // filtering by service UUID can miss some Android devices
      { allowDuplicates: false },
      (error: any, device: any) => {
        if (error) {
          console.error("BLE scan error:", error.message);
          bleStore.setError(`Scan failed: ${error.message}`);
          return;
        }

        if (device?.name === BLE_DEVICE_NAME) {
          console.log("BLE: found", device.name, "RSSI:", device.rssi);
          useBLEStore.getState().setRSSI(device.rssi);
          // don't connect here — return device to the UI
          // user confirms which device to connect to
        }
      }
    );

    // auto-stop scan after 20 seconds
    this.scanTimeout = setTimeout(() => {
      this.stopScan();
      if (bleStore.connectionState === "scanning") {
        bleStore.setConnectionState("disconnected");
        console.log("BLE: scan timed out — no device found");
      }
    }, 20000);
  }

  // ── scan and return found devices ──────────────────────────
  async scanForDevices(
    onDeviceFound: (device: any) => void
  ): Promise<void> {
    if (!this.ensureManager()) {
      useBLEStore.getState().setError(
        "Bluetooth not available on this build."
      );
      return;
    }

    const hasPermission = await this.requestPermissions();
    if (!hasPermission) return;

    const state = await this.ble.state();
    console.log("BLE: Bluetooth state:", state);

    if (state !== "PoweredOn") {
      useBLEStore.getState().setError(
        "Please turn on Bluetooth and try again."
      );
      return;
    }

    useBLEStore.getState().setConnectionState("scanning");
    console.log("BLE: scanning...");

    const foundIds = new Set<string>();

    this.ble.startDeviceScan(
      null,
      { allowDuplicates: false },
      (error: any, device: any) => {
        if (error) {
          console.error("BLE scan error:", error.reason ?? error.message);
          useBLEStore.getState().setError(error.reason ?? "Scan error");
          return;
        }

        if (
          device?.name?.includes("VitalSync") &&
          !foundIds.has(device.id)
        ) {
          foundIds.add(device.id);
          console.log("BLE: device found:", device.name, device.id);
          onDeviceFound(device);
        }
      }
    );

    // stop after 20 seconds
    this.scanTimeout = setTimeout(() => {
      this.stopScan();
      console.log("BLE: scan complete");
      if (useBLEStore.getState().connectionState === "scanning") {
        useBLEStore.getState().setConnectionState("disconnected");
      }
    }, 20000);
  }

  stopScan(): void {
    if (this.ble) {
      this.ble.stopDeviceScan();
      console.log("BLE: scan stopped");
    }
    if (this.scanTimeout) {
      clearTimeout(this.scanTimeout);
      this.scanTimeout = null;
    }
  }

  // ── connect to a specific device ──────────────────────────
  async connectToDevice(device: any): Promise<boolean> {
    if (!this.ble) return false;

    const bleStore = useBLEStore.getState();
    bleStore.setConnectionState("connecting");
    this.stopScan();

    console.log("BLE: connecting to", device.name);

    try {
      this.device = await this.ble.connectToDevice(device.id, {
        autoConnect: false,
        timeout: 10000,
        // timeout after 10 seconds if connection fails
      });

      console.log("BLE: connected — discovering services");

      await this.device.discoverAllServicesAndCharacteristics();
      // must discover before reading or writing any characteristic

      console.log("BLE: services discovered");

      // sync ESP32 clock immediately after connecting
      await this.syncTime();

      // subscribe to data notifications
      this.startListening();

      // handle unexpected disconnection
      this.device.onDisconnected((error: any, device: any) => {
        console.log("BLE: device disconnected", error?.message);
        bleStore.setDisconnected();
        this.device = null;
        this.resetSession();
      });

      bleStore.setConnected(device.name, device.id);
      console.log("BLE: fully connected and listening");
      return true;

    } catch (err: any) {
      console.error("BLE: connection failed:", err.message);
      bleStore.setError(`Connection failed: ${err.reason ?? err.message}`);
      this.device = null;
      return false;
    }
  }

  // ── sync ESP32 clock ──────────────────────────────────────
  private async syncTime(): Promise<void> {
    if (!this.device) return;
    try {
      await this.device.writeCharacteristicWithResponseForService(
        BLE_SERVICE_UUID,
        BLE_CHARACTERISTICS.CONTROL,
        encodeTimestampBase64()
      );
      console.log("BLE: time synced");
    } catch (err: any) {
      console.log("BLE: time sync failed (non-fatal):", err.message);
    }
  }

  // ── listen for incoming packets ───────────────────────────
  private startListening(): void {
    if (!this.device) return;

    console.log("BLE: subscribing to data notifications");

    this.device.monitorCharacteristicForService(
      BLE_SERVICE_UUID,
      BLE_CHARACTERISTICS.DATA,
      async (error: any, characteristic: any) => {
        if (error) {
          if (error.errorCode === 201) return;
          // 201 = operation cancelled (normal on disconnect)
          console.error("BLE notification error:", error.message);
          return;
        }

        if (!characteristic?.value) return;

        useBLEStore.getState().incrementPackets();

        const bytes = Buffer.from(characteristic.value, "base64");
        const data = Array.from(bytes) as number[];

        try {
          const packet = decodePacket(data);
          await this.handlePacket(packet);
        } catch (err: any) {
          console.error("BLE decode error:", err.message);
        }
      }
    );
  }

  // ── route packets by type ─────────────────────────────────
  private async handlePacket(packet: any): Promise<void> {
    if (packet.type === "vitals") {
      console.log("BLE: vitals —", packet.heartRate, "bpm,", packet.spO2, "%");
      this.resetSession();
      this.session.vitals = packet;

    } else if (packet.type === "classification") {
      console.log("BLE: classification —", packet.overallClassificationLabel);
      this.session.classification = packet;

    } else if (packet.type === "ecg_fragment") {
      this.session.ecgFragments.set(packet.fragmentIndex, packet);

      if (this.session.ecgFragments.size === ECG_TOTAL_FRAGMENTS) {
        await this.completeMeasurement();
      }
    }
  }

  // ── assemble and upload complete measurement ──────────────
  private async completeMeasurement(): Promise<void> {
    const { vitals, classification, ecgFragments } = this.session;
    if (!vitals) return;

    // validate all fragments received
    for (let i = 0; i < ECG_TOTAL_FRAGMENTS; i++) {
      if (!ecgFragments.has(i)) {
        console.error("BLE: missing fragment", i, "— discarding measurement");
        this.resetSession();
        return;
      }
    }

    // assemble ECG samples in order
    const ecgSamples: number[] = [];
    for (let i = 0; i < ECG_TOTAL_FRAGMENTS; i++) {
      ecgSamples.push(...ecgFragments.get(i)!.samples);
    }

    console.log("BLE: measurement complete —", ecgSamples.length, "ECG samples");

    const apiBody = vitalsToAPIBody(vitals, classification, ecgSamples);

    // update vitals store so dashboard updates immediately
    if (vitals.heartRate || vitals.spO2) {
      useVitalsStore.getState().setLatestVitals({
        ...apiBody,
        id: Date.now().toString(),
        userId: "",
        hasAnomaly: false,
        anomalyDetails: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as any);
    }

    useBLEStore.getState().setLastReadingAt(new Date().toISOString());
    useBLEStore.getState().resetPackets();

    await this.uploadToCloud(apiBody);
    this.resetSession();
  }

  private resetSession(): void {
    this.session = {
      vitals: null,
      classification: null,
      ecgFragments: new Map(),
    };
  }

  // ── upload to cloud with offline queue ───────────────────
  private async uploadToCloud(data: any): Promise<void> {
    try {
      const res = await api.post("/api/v1/vitals/reading", data);
      console.log("BLE: uploaded — health score:", res.data.data?.healthScore);
      await this.flushOfflineQueue();
    } catch {
      console.log("BLE: upload failed — queuing offline");
      await this.addToQueue(data);
    }
  }

  private async addToQueue(data: any): Promise<void> {
    this.offlineQueue.push({ ...data, queuedAt: Date.now() });
    await AsyncStorage.setItem("ble_queue", JSON.stringify(this.offlineQueue));
  }

  private async loadOfflineQueue(): Promise<void> {
    const stored = await AsyncStorage.getItem("ble_queue");
    if (stored) this.offlineQueue = JSON.parse(stored);
  }

  private async flushOfflineQueue(): Promise<void> {
    if (this.offlineQueue.length === 0) return;
    const sent: number[] = [];
    for (let i = 0; i < this.offlineQueue.length; i++) {
      try {
        await api.post("/api/v1/vitals/reading", this.offlineQueue[i]);
        sent.push(i);
      } catch { break; }
    }
    this.offlineQueue = this.offlineQueue.filter((_, i) => !sent.includes(i));
    await AsyncStorage.setItem("ble_queue", JSON.stringify(this.offlineQueue));
    if (sent.length > 0) console.log("BLE: flushed", sent.length, "queued readings");
  }

  async disconnect(): Promise<void> {
    if (this.device) {
      await this.device.cancelConnection().catch(() => {});
      this.device = null;
    }
    useBLEStore.getState().setDisconnected();
    this.resetSession();
    console.log("BLE: disconnected by user");
  }

  get isConnected(): boolean {
    return this.device !== null;
  }
}

export const bleManager = new VitalSyncBLEManager();