import { create } from "zustand";

export type BLEConnectionState =
  | "disconnected"
  | "scanning"
  | "connecting"
  | "connected"
  | "error";

interface BLEState {
  connectionState: BLEConnectionState;

  deviceName: string | null;
  deviceId: string | null;
 
  rssi: number | null;

  batteryLevel: number | null;
  lastReadingAt: string | null;

  errorMessage: string | null;
  packetsReceived: number;

  // actions
  setConnectionState: (state: BLEConnectionState) => void;
  setConnected: (deviceName: string, deviceId: string) => void;
  setDisconnected: () => void;
  setRSSI: (rssi: number) => void;
  setBattery: (level: number) => void;
  setError: (message: string) => void;
  setLastReadingAt: (time: string) => void;
  incrementPackets: () => void;
  resetPackets: () => void;
}

const useBLEStore = create<BLEState>((set) => ({
  connectionState: "disconnected",
  deviceName: null,
  deviceId: null,
  rssi: null,
  batteryLevel: null,
  lastReadingAt: null,
  errorMessage: null,
  packetsReceived: 0,

  setConnectionState: (state) => {
    console.log("BLEStore: state →", state);
    set({ connectionState: state, errorMessage: null });
  },

  setConnected: (deviceName, deviceId) => {
    console.log("BLEStore: connected to", deviceName);
    set({
      connectionState: "connected",
      deviceName,
      deviceId,
      errorMessage: null,
    });
  },

  setDisconnected: () => {
    console.log("BLEStore: disconnected");
    set({
      connectionState: "disconnected",
      deviceName: null,
      rssi: null,
      packetsReceived: 0,
    });
  },

  setRSSI: (rssi) => set({ rssi }),
  setBattery: (level) => set({ batteryLevel: level }),

  setError: (message) => {
    console.log("BLEStore: error —", message);
    set({ connectionState: "error", errorMessage: message });
  },

  setLastReadingAt: (time) => set({ lastReadingAt: time }),

  incrementPackets: () =>
    set((state) => ({ packetsReceived: state.packetsReceived + 1 })),

  resetPackets: () => set({ packetsReceived: 0 }),
}));

export default useBLEStore;