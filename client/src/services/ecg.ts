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
  console.log("🫀 ECG SERVICE: fetching latest ECG");

  try {
    const response = await api.get("/api/v1/vitals/ecg/latest");

    console.log("🫀 ECG SERVICE: status:", response.status);
    console.log("🫀 ECG SERVICE: response:", response.data);

    return response.data.data ?? null;

  } catch (error: any) {
    console.log("🫀 ECG SERVICE ERROR");
    console.log("🫀 Status:", error?.response?.status);
    console.log("🫀 Message:", error?.response?.data?.message);
    console.log("🫀 Response:", error?.response?.data);

    if (error.response?.status === 404) {
      console.log("🫀 ECG: NO DATA RECORDED YET");
      return null;
    }

    throw error;
  }
};