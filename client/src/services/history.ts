import api from "./api";



export interface DailyAverage {
  day: string;
  avgHeartRate: string | null;
  avgSpO2: string | null;
  avgBodyTemperature: string | null;
  avgRespiratoryRate: string | null;
  avgRoomHumidity: string | null;
  totalReadings: number;
  anomalyCount: number;
}

export interface HistorySummary {
  avgHeartRate: number | null;
  avgSpO2: number | null;
  avgBodyTemperature: number | null;
  avgRespiratoryRate: number | null;
  avgRoomHumidity: number | null;
  totalReadings: number;
  totalAnomalies: number;
  daysAnalysed: number;
}

export interface HistoryResponse {
  dailyAverages: DailyAverage[];
  summary: HistorySummary;
}

export interface AlertItem {
  id: string;
  type: "threshold_breach" | "sos" | "device_disconnected";
  severity: "low" | "medium" | "high" | "critical";
  metric: string | null;
  value: number | null;
  threshold: number | null;
  message: string;
  acknowledged: boolean;
  createdAt: string;
}

//  fetch daily averages 
export const fetchVitalsHistory = async (
  days: number = 30
): Promise<HistoryResponse | null> => {

  console.log(`historyService: fetching ${days}-day history`);

  try {
    const response = await api.get(`/api/v1/vitals/history?days=${days}`);
  

    console.log(
      "historyService: received",
      response.data.data?.dailyAverages?.length,
      "daily averages"
    );

    return response.data.data ?? null;

  } catch (error: any) {
    console.error("historyService: failed:", error.response?.data ?? error.message);
    throw error;
  }
};

// fetch alert history 
export const fetchAlerts = async (): Promise<AlertItem[]> => {

  console.log("historyService: fetching alerts");

  try {
    const response = await api.get("/api/v1/alerts");
   

    console.log("historyService: received", response.data.count, "alerts");
    return response.data.data ?? [];

  } catch (error: any) {
    console.error("historyService: alerts failed:", error.message);
    return [];

  }
};

// acknowledge an alert 
export const acknowledgeAlert = async (alertId: string): Promise<void> => {
  console.log("historyService: acknowledging alert:", alertId);
  await api.put(`/api/v1/alerts/${alertId}/acknowledge`);

};
// add to existing history.ts
export const generateShareLink = async (
  caregiverId: string
): Promise<{ shareUrl: string; expiresAt: string }> => {
  const response = await api.post(
    `/api/v1/caregivers/${caregiverId}/share`
  );
  return response.data.data;
};

export const fetchCaregivers = async () => {
  const response = await api.get("/api/v1/caregivers");
  return response.data.data ?? [];
};



export const generatePublicShareToken = async (): Promise<{
  shareUrl: string;
  expiresAt: string;
}> => {

  const response = await api.post("/api/v1/share/generate-public");
  return response.data.data;
};