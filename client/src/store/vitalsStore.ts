import { create } from "zustand";
import { Vitals, Alert } from "../types";

interface VitalsState {
  latestVitals: Vitals | null;
  isConnected: boolean;
  isLoading: boolean;
  activeAlert: Alert | null;
  unreadAlertCount: number;
  lastReadingAt: string | null;


  setLatestVitals: (vitals: Vitals) => void;
  setConnected: (connected: boolean) => void;
  setLoading: (loading: boolean) => void;
  setActiveAlert: (alert: Alert | null) => void;
  incrementUnreadCount: () => void;
  clearActiveAlert: () => void;
  setLastReadingAt: (time: string) => void;
 
}

const useVitalsStore = create<VitalsState>((set) => ({
  latestVitals: null,
  isConnected: false,
  isLoading: false,
  activeAlert: null,
  unreadAlertCount: 0,
  lastReadingAt: null,
 

  setLatestVitals: (vitals: Vitals) => {
    console.log("vitalsStore: new vitals:", vitals.heartRate);
    set({ latestVitals: vitals });
  },
  setConnected: (connected: boolean) => {
    console.log("vitalsStore: connected:", connected);
    set({ isConnected: connected });
  },
  setLoading: (loading: boolean) => set({ isLoading: loading }),
  setActiveAlert: (alert: Alert | null) => set({ activeAlert: alert }),
  incrementUnreadCount: () =>
    set((state) => ({ unreadAlertCount: state.unreadAlertCount + 1 })),
  clearActiveAlert: () => set({ activeAlert: null }),
  setLastReadingAt: (time: string) => {
    console.log("vitalsStore: last reading at:", time);
    set({ lastReadingAt: time });
   
  },
}));

export default useVitalsStore;