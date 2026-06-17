import { create } from "zustand";
import { Vitals, Alert } from "../types";


interface VitalsState { 
  latestVitals: Vitals | null;

  isConnected: boolean;

  isLoading: boolean;
  

  //  alerts 
  activeAlert: Alert | null;
 

  unreadAlertCount: number;


  //  actions 
  setLatestVitals: (vitals: Vitals) => void;
  setConnected: (connected: boolean) => void;
  setLoading: (loading: boolean) => void;
  setActiveAlert: (alert: Alert | null) => void;
  incrementUnreadCount: () => void;
  clearActiveAlert: () => void;
}

const useVitalsStore = create<VitalsState>((set) => ({
  latestVitals: null,
  isConnected: false,
  isLoading: false,
  activeAlert: null,
  unreadAlertCount: 0,

  setLatestVitals: (vitals: Vitals) => {
    console.log("vitalsStore: new vitals received:", {
      heartRate: vitals.heartRate,
      spO2: vitals.spO2,
      hasAnomaly: vitals.hasAnomaly,
    });
    set({ latestVitals: vitals });
   
  },

  setConnected: (connected: boolean) => {
    console.log("vitalsStore: connection status:", connected);
    set({ isConnected: connected });
  },

  setLoading: (loading: boolean) => set({ isLoading: loading }),

  setActiveAlert: (alert: Alert | null) => {
    console.log("vitalsStore: active alert set:", alert?.message ?? "cleared");
    set({ activeAlert: alert });
  },

  incrementUnreadCount: () =>
    set((state) => ({ unreadAlertCount: state.unreadAlertCount + 1 })),
  

  clearActiveAlert: () => set({ activeAlert: null }),
}));

export default useVitalsStore;