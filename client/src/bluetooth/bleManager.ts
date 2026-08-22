
import { BleManager, Device } from "react-native-ble-plx";
import {
  BLE_SERVICE_UUID,
  BLE_CHARACTERISTICS,
  BLE_DEVICE_NAME,
  ECG_TOTAL_FRAGMENTS,
  ECG_TOTAL_SAMPLES,
} from "./bleConstants";
import {
  decodePacket,
  VitalsPacket,
  ClassificationPacket,
  ECGFragment,
  vitalsToAPIBody,
} from "./packetDecoder";
import { encodeTimestampBase64 } from "./packetEncoder";
import api from "../services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Buffer } from "buffer";


interface MeasurementSession {
  sequence: number;
  vitals: VitalsPacket | null;
  classification: ClassificationPacket | null;
  ecgFragments: Map<number, ECGFragment>;

}

class VitalSyncBLEManager {
  private manager: BleManager;
  private connectedDevice: Device | null = null;
  private currentSession: MeasurementSession | null = null;
  private offlineQueue: any[] = [];

  constructor() {
    this.manager = new BleManager();
    this.restoreOfflineQueue();
  }

  // scan 
  async startScan(onFound: (device: Device) => void): Promise<void> {
    console.log("BLE: scanning for", BLE_DEVICE_NAME);

    this.manager.startDeviceScan(
      [BLE_SERVICE_UUID],
      { allowDuplicates: false },
      (error, device) => {
        if (error) {
          console.error("BLE scan error:", error.message);
          return;
        }
        if (device?.name === BLE_DEVICE_NAME) {
         
          console.log("BLE: device found:", device.id);
          this.manager.stopDeviceScan();
          onFound(device);
        }
      }
    );
  }

  //  connect 
  async connect(device: Device): Promise<void> {
    console.log("BLE: connecting to", device.name);
    this.connectedDevice = await device.connect();
    await this.connectedDevice.discoverAllServicesAndCharacteristics();
    console.log("BLE: connected — syncing time");

   
    await this.syncTime();
    this.startListening();
  }

  //  time sync 
  private async syncTime(): Promise<void> {
    if (!this.connectedDevice) return;

    try {
      await this.connectedDevice.writeCharacteristicWithResponseForService(
        BLE_SERVICE_UUID,
        BLE_CHARACTERISTICS.CONTROL,
        encodeTimestampBase64()
      
      );
      console.log("BLE: time synced successfully");
    } catch (err: any) {
      console.error("BLE: time sync failed:", err.message);
   
    }
  }

  // listen for data notifications 
  private startListening(): void {
    if (!this.connectedDevice) return;

    this.connectedDevice.monitorCharacteristicForService(
      BLE_SERVICE_UUID,
      BLE_CHARACTERISTICS.DATA,
      
      async (error, characteristic) => {
        if (error) {
          console.error("BLE notification error:", error.message);
          return;
        }
        if (!characteristic?.value) return;

        // characteristic.value is base64 encoded
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

    console.log("BLE: listening for measurement notifications");
  }

  // packet router 
  private async handlePacket(packet: ReturnType<typeof decodePacket>): Promise<void> {
    if (packet.type === "vitals") {
      
      console.log("BLE: vitals packet received — starting new measurement session");
      this.currentSession = {
        sequence: 0,
        vitals: packet,
        classification: null,
        ecgFragments: new Map(),
      };

    } else if (packet.type === "classification") {
      // classification arrives SECOND
      console.log(
        "BLE: classification packet —",
        packet.overallClassificationLabel,
        `(${packet.confidence}% confidence)`
      );

      if (this.currentSession) {
        this.currentSession.classification = packet;
        this.currentSession.sequence = packet.measurementSequence;
      }

    } else if (packet.type === "ecg_fragment") {
      // ECG fragments arrive THIRD — 143 of them
      if (!this.currentSession) {
        console.warn("BLE: ECG fragment received without an active session");
        return;
      }

      this.currentSession.ecgFragments.set(
        packet.fragmentIndex,
        packet
    
      );

      console.log(
        `BLE: ECG fragment ${packet.fragmentIndex}/${ECG_TOTAL_FRAGMENTS - 1}`,
        `(${this.currentSession.ecgFragments.size}/${ECG_TOTAL_FRAGMENTS} received)`
      );

      // check if we have all fragments
      if (this.currentSession.ecgFragments.size === ECG_TOTAL_FRAGMENTS) {
        await this.completeMeasurement();
      }
    }
  }

  //complete a full measurement and send to cloud 
  private async completeMeasurement(): Promise<void> {
    const session = this.currentSession;
    if (!session || !session.vitals) return;

    console.log("BLE: measurement complete — assembling ECG");


    const missingFragments: number[] = [];
    for (let i = 0; i < ECG_TOTAL_FRAGMENTS; i++) {
      if (!session.ecgFragments.has(i)) {
        missingFragments.push(i);
      }
    }

    if (missingFragments.length > 0) {
      console.error(
        "BLE: measurement incomplete — missing fragments:",
        missingFragments
      );
     
      this.currentSession = null;
      return;
    }

   
    const ecgSamples: number[] = [];
    for (let i = 0; i < ECG_TOTAL_FRAGMENTS; i++) {
      const fragment = session.ecgFragments.get(i)!;
      ecgSamples.push(...fragment.samples);
    }

    console.log(
      `BLE: ECG assembled — ${ecgSamples.length} samples`,
      `(expected ${ECG_TOTAL_SAMPLES})`
    );

    if (ecgSamples.length !== ECG_TOTAL_SAMPLES) {
      console.error("BLE: wrong sample count — discarding measurement");
      this.currentSession = null;
      return;
    }

    // build API body from all three packet types
    const apiBody = vitalsToAPIBody(
      session.vitals,
      session.classification,
      ecgSamples
    );

    console.log("BLE: sending measurement to cloud:", {
      heartRate: apiBody.heartRate,
      spO2: apiBody.spO2,
      temperature: apiBody.bodyTemperature,
      ecgSamples: ecgSamples.length,
      classification: apiBody.tinyMLClassification,
      confidence: apiBody.tinyMLConfidence,
    });

    // send to backend
    await this.sendToCloud(apiBody);

    // clear session — ready for next measurement
    this.currentSession = null;
  }

  //  cloud upload with offline fallback 
  private async sendToCloud(data: any): Promise<void> {
    try {
      const response = await api.post("/api/v1/vitals/reading", data);
      console.log("BLE relay: uploaded successfully — health score:", response.data.data?.healthScore);
      await this.flushOfflineQueue();
    } catch {
      console.log("BLE relay: cloud unavailable — queuing offline");
      await this.addToOfflineQueue(data);
    }
  }

  private async addToOfflineQueue(data: any): Promise<void> {
    this.offlineQueue.push({ ...data, queuedAt: Date.now() });
    await AsyncStorage.setItem(
      "ble_offline_queue",
      JSON.stringify(this.offlineQueue)
    );
    console.log("BLE offline queue:", this.offlineQueue.length, "readings stored");
  }

  private async restoreOfflineQueue(): Promise<void> {
    const stored = await AsyncStorage.getItem("ble_offline_queue");
    if (stored) {
      this.offlineQueue = JSON.parse(stored);
      console.log("BLE: restored", this.offlineQueue.length, "offline readings");
    }
  }

  private async flushOfflineQueue(): Promise<void> {
    if (this.offlineQueue.length === 0) return;

    const sent: number[] = [];
    for (let i = 0; i < this.offlineQueue.length; i++) {
      try {
        await api.post("/api/v1/vitals/reading", this.offlineQueue[i]);
        sent.push(i);
      } catch {
        break;
      }
    }

    this.offlineQueue = this.offlineQueue.filter((_, i) => !sent.includes(i));
    await AsyncStorage.setItem(
      "ble_offline_queue",
      JSON.stringify(this.offlineQueue)
    );

    if (sent.length > 0) {
      console.log(`BLE: flushed ${sent.length} queued readings`);
    }
  }

  async disconnect(): Promise<void> {
    if (this.connectedDevice) {
      await this.connectedDevice.cancelConnection();
      this.connectedDevice = null;
      this.currentSession = null;
      console.log("BLE: disconnected");
    }
  }

  get isConnected(): boolean {
    return this.connectedDevice !== null;
  }
}

export const bleManager = new VitalSyncBLEManager();