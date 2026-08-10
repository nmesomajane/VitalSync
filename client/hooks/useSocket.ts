import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";

import useVitalsStore from "../src/store/vitalsStore";
import useAuthStore from "../src/store/authStore";
import { Vitals, Alert } from "../src/types";
import { triggerAnomalyNotification } from "../src/services/notifications";

const SOCKET_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://10.0.2.2:3000";

export const useSocket = () => {
  const socketRef = useRef<Socket | null>(null);

  const {
    setLatestVitals,
    setConnected,
    setActiveAlert,
    incrementUnreadCount,
  } = useVitalsStore();

  const { token } = useAuthStore();

  useEffect(() => {
    if (!token) {
      console.log("useSocket: no token — skipping WebSocket connection");
      return;
    }

    const connectSocket = async () => {
      console.log("useSocket: connecting to", SOCKET_URL);

      const socket = io(SOCKET_URL, {
        auth: { token },

        transports: ["websocket"],

        reconnection: true,

        reconnectionAttempts: 5,
        reconnectionDelay: 2000,
      });

      socketRef.current = socket;

      socket.on("connect", () => {
        console.log("useSocket: ✅ connected — socket id:", socket.id);
        setConnected(true);
      });

      socket.on("disconnect", (reason: string) => {
        console.log("useSocket: ❌ disconnected — reason:", reason);
        setConnected(false);
        // update global state — UI shows "Offline" indicator
      });

      socket.on("connect_error", (error: Error) => {
        console.error("useSocket: connection error:", error.message);
        setConnected(false);
      });

      // vitals events
      socket.on(
        "vitals:update",
        (payload: { vital: Vitals; healthScore: number }) => {
          console.log("useSocket: vitals:update received:", {
            heartRate: payload.vital?.heartRate,
            hasAnomaly: payload.vital?.hasAnomaly,
          });

          if (payload.vital) {
            const vitalsWithScore: Vitals = {
              ...payload.vital,
              healthScore: payload.healthScore,
            };
            setLatestVitals(vitalsWithScore);

            // ↓ ADD THIS LINE
            useVitalsStore
              .getState()
              .setLastReadingAt(new Date().toISOString());
            // records the exact moment live hardware data arrived
            // used to determine if data is fresh or stale
          }
        },
      );

      //  alert events
      socket.on("vitals:alert", async (alertData: Alert) => {
        console.log("useSocket: vitals:alert received:", alertData.message);

        setActiveAlert(alertData);

        incrementUnreadCount();

        await triggerAnomalyNotification(alertData);
      });
      // ECG stream
      socket.on("ecg:stream", (payload: { ecgData: number[] }) => {
        console.log(
          "useSocket: ecg:stream received, points:",
          payload.ecgData?.length,
        );
      });
    };

    connectSocket();

    // cleanup
    return () => {
      if (socketRef.current) {
        console.log("useSocket: disconnecting socket");
        socketRef.current.disconnect();
        socketRef.current = null;
        setConnected(false);
      }
    };
  }, [token]);

  return socketRef.current;
};
