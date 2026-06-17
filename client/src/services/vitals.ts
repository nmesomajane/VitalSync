import api from "./api";
import { Vitals, ApiResponse } from "../types";

// fetch the most recent vital reading 
export const fetchLatestVitals = async (): Promise<Vitals | null> => {
  

  console.log("vitalsService: fetching latest vitals");

  const response = await api.get<ApiResponse<Vitals>>("/api/v1/vitals/latest");


  console.log("vitalsService: latest vitals received:", response.data.data);

  return response.data.data ?? null;

};

// fetch 30-day history
export const fetchVitalsHistory = async (days: number = 30) => {
  console.log(`vitalsService: fetching ${days}-day history`);

  const response = await api.get(`/api/v1/vitals/history?days=${days}`);
 

  return response.data.data;
};

// trigger emergency SOS
export const triggerSOS = async (currentVitals: Partial<Vitals>) => {
 

  console.log("vitalsService: triggering SOS");

  const response = await api.post("/api/v1/alerts/sos", { currentVitals });
  return response.data;
};

//  acknowledge an alert 
export const acknowledgeAlert = async (alertId: string) => {
  console.log("vitalsService: acknowledging alert:", alertId);

  const response = await api.put(`/api/v1/alerts/${alertId}/acknowledge`);
  return response.data;
};