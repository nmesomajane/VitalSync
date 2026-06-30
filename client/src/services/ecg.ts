import api from "./api";


export interface ECGAnalysis {
  rhythmStatus: "regular" | "slightly_irregular" | "irregular";

  derivedHeartRate: number;

  hrv: number;


  peakCount: number;


  rrIntervals: number[];

  message: string;
}

export interface ECGData {
  waveform: { x: number; y: number }[];
  
  rawData: number[];

  analysis: ECGAnalysis;
  recordedAt: string;
  hasAnomaly: boolean;
}

// fetch latest stored ECG from database
export const fetchLatestECG = async (): Promise<ECGData | null> => {
  console.log("ecgService: fetching latest ECG from REST API");

  try {
    const response = await api.get("/api/v1/vitals/ecg/latest");
   

    console.log("ecgService: ECG received, points:", response.data.data?.waveform?.length);
    return response.data.data ?? null;

  } catch (error: any) {
    if (error.response?.status === 404) {
   
      console.log("ecgService: no ECG data recorded yet");
      return null;
    }
   
    console.error("ecgService: failed to fetch ECG:", error.message);
    throw error;
  }
};