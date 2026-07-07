import { useState, useEffect, useCallback } from "react";
import {
  fetchVitalsHistory,
  fetchAlerts,
  acknowledgeAlert,
  DailyAverage,
  HistorySummary,
  AlertItem,
} from "../src/services/history";
import useVitalsStore from "../src/store/vitalsStore";


export type MetricKey =
  | "heartRate"
  | "spO2"
  | "bodyTemperature"
  | "respiratoryRate"
  | "roomHumidity";

// maps MetricKey to the field name in DailyAverage

const METRIC_TO_FIELD: Record<MetricKey, keyof DailyAverage> = {
  heartRate: "avgHeartRate",
  spO2: "avgSpO2",
  bodyTemperature: "avgBodyTemperature",
  respiratoryRate: "avgRespiratoryRate",
  roomHumidity: "avgRoomHumidity",
};


export interface HistoryHookResult {

  chartData: { x: number; y: number; label: string }[];
 
  summary: HistorySummary | null;

  // alerts
  alerts: AlertItem[];
  onAcknowledge: (alertId: string) => Promise<void>;

  // selected state
  selectedMetric: MetricKey;
  setSelectedMetric: (metric: MetricKey) => void;
  selectedDays: number;
  setSelectedDays: (days: number) => void;

  // loading states
  isLoading: boolean;
  isRefreshing: boolean;

  // error
  error: string | null;

  // actions
  refresh: () => void;
}

export const useHistory = (): HistoryHookResult => {
  const [dailyAverages, setDailyAverages] = useState<DailyAverage[]>([]);
  const [summary, setSummary] = useState<HistorySummary | null>(null);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [selectedMetric, setSelectedMetric] = useState<MetricKey>("heartRate");

  const [selectedDays, setSelectedDays] = useState<number>(7);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const { unreadAlertCount } = useVitalsStore();

  // fetch all data 
  const loadData = useCallback(async (showRefresh: boolean = false) => {
    

    console.log(`useHistory: loading ${selectedDays}-day history`);

    if (showRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
    
      const [historyData, alertsData] = await Promise.all([
        fetchVitalsHistory(selectedDays),
        fetchAlerts(),
      ]);

      if (historyData) {
        setDailyAverages(historyData.dailyAverages);
        setSummary(historyData.summary);
        console.log(
          "useHistory: loaded",
          historyData.dailyAverages.length,
          "days"
        );
      }

      setAlerts(alertsData);
      console.log("useHistory: loaded", alertsData.length, "alerts");

    } catch (err: any) {
      console.error("useHistory: failed to load:", err.message);
      setError("Failed to load history. Pull down to refresh.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [selectedDays]);
 

  //  load on mount and when days change 
  useEffect(() => {
    loadData();
  }, [loadData]);
 

  //build chart data 
  const chartData = dailyAverages
    .map((day, index) => {
      const fieldName = METRIC_TO_FIELD[selectedMetric];
     

      const rawValue = day[fieldName];
    

      const value = rawValue ? parseFloat(rawValue as string) : 0;
     
      const date = new Date(day.day);
      const label = date.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
      });
      

      return {
        x: index,
        y: value,
        label,
      };
    })
    .filter(point => point.y > 0);


  // acknowledge alert 
  const onAcknowledge = async (alertId: string): Promise<void> => {
    try {
      await acknowledgeAlert(alertId);
     

      setAlerts(prev =>
        prev.map(alert =>
          alert.id === alertId
            ? { ...alert, acknowledged: true }
          
            : alert
         
        )
      );

      console.log("useHistory: alert acknowledged:", alertId);

    } catch (err) {
      console.error("useHistory: acknowledge failed:", err);
    }
  };

  return {
    chartData,
    summary,
    alerts,
    onAcknowledge,
    selectedMetric,
    setSelectedMetric,
    selectedDays,
    setSelectedDays,
    isLoading,
    isRefreshing,
    error,
    refresh: () => loadData(true),
  
  };
};