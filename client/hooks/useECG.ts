import { useState, useEffect, useRef, useCallback } from "react";
import { fetchLatestECG, ECGData } from "../src/services/ecg";
// import useVitalsStore from "../store/vitalsStore";




const MAX_POINTS = 150;

export interface ECGHookResult {
 
  waveformData: { x: number; y: number }[];

  analysis: ECGData["analysis"] | null;

  recordedAt: string | null;

  hasAnomaly: boolean;

  isLoading: boolean;

  isLive: boolean;

  error: string | null;
 

  refresh: () => void;

}

export const useECG = (socket: any): ECGHookResult => {
 

  const [waveformData, setWaveformData] = useState<{ x: number; y: number }[]>([]);


  const [analysis, setAnalysis] = useState<ECGData["analysis"] | null>(null);


  const [recordedAt, setRecordedAt] = useState<string | null>(null);
  const [hasAnomaly, setHasAnomaly] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLive, setIsLive] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const xCounterRef = useRef<number>(0);
 

  //fetch stored ECG from REST API 
  const loadStoredECG = useCallback(async () => {
   

    console.log("useECG: loading stored ECG from REST API");
    setIsLoading(true);
    setError(null);

    try {
      const ecgData = await fetchLatestECG();

      if (ecgData) {
     
        const recentPoints = ecgData.waveform.slice(-MAX_POINTS);
        setWaveformData(recentPoints);

        xCounterRef.current = ecgData.waveform.length;
      

        setAnalysis(ecgData.analysis);
        setRecordedAt(ecgData.recordedAt);
        setHasAnomaly(ecgData.hasAnomaly);
        console.log("useECG: stored ECG loaded, points:", recentPoints.length);
      } else {
        // no ECG recorded yet — new user or device not connected
        console.log("useECG: no stored ECG found");
      }

    } catch (err) {
      console.error("useECG: error loading ECG:", err);
      setError("Failed to load ECG data. Check your connection.");
    } finally {
      setIsLoading(false);
    }
  }, []);
 

  // load on mount 
  useEffect(() => {
    loadStoredECG();
   
  }, [loadStoredECG]);

  //  listen for live ECG from WebSocket 
  useEffect(() => {
    if (!socket) {
      console.log("useECG: no socket available yet");
      return;
    }

    console.log("useECG: attaching ecg:stream listener to socket");

    const handleECGStream = (payload: { ecgData: number[]; timestamp: string }) => {
      // fires when hardware sends a new ECG reading
      

      console.log("useECG: ecg:stream received, new points:", payload.ecgData?.length);
      setIsLive(true);
    

      if (!payload.ecgData || payload.ecgData.length === 0) return;
    
      const newPoints = payload.ecgData.map((value: number) => {
        xCounterRef.current += 1;
        

        return {
          x: xCounterRef.current,
         
          y: value,
        
        };
      });

      setWaveformData((prev) => {
       
        const combined = [...prev, ...newPoints];
        return combined.slice(-MAX_POINTS);
       
      });
    };

    socket.on("ecg:stream", handleECGStream);
    

    return () => {
      socket.off("ecg:stream", handleECGStream);
    
      console.log("useECG: ecg:stream listener removed");
    };
  }, [socket]);
 

  return {
    waveformData,
    analysis,
    recordedAt,
    hasAnomaly,
    isLoading,
    isLive,
    error,
    refresh: loadStoredECG,

  };
};