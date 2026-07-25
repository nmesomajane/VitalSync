// src/types/index.ts

//  User ─
export interface User {
  id: string;
  name: string;
  email: string;
  age?: number;
  // ? means optional — the field may or may not exist
  gender?: "male" | "female" | "other";
  // union type — only these three values allowed
  photo?: string;
  fcmToken?: string;
  aiDataConsent?: boolean;
}

//  Auth ─
export interface AuthResponse {
  success: boolean;
  message: string;
  token: string;
  user: User;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface SignupPayload {
  name: string;
  email: string;
  password: string;
  age?: number;
  gender?: "male" | "female" | "other";
}

//  Vitals ─
export interface Vitals {
  id: string;
  userId: string;
  heartRate: number | null;
  spO2: number | null;
  bodyTemperature: number | null;
  respiratoryRate: number | null;
  roomHumidity: number | null;
  ecgData: number[] | null;
  hasAnomaly: boolean;
  anomalyDetails: Record<string, AnomalyDetail> | null;
  healthScore?: number;
  ecgPreview?: number[];
  createdAt: string;
  updatedAt: string;
}

export interface AnomalyDetail {
  value: number;
  threshold: number;
  status: "high" | "low";
  message: string;
}

//  Alert 
export interface Alert {
  id: string;
  userId: string;
  type: "threshold_breach" | "sos" | "device_disconnected";
  severity: "low" | "medium" | "high" | "critical";
  metric: string | null;
  value: number | null;
  threshold: number | null;
  message: string;
  vitalsSnapshot: Partial<Vitals> | null;
  acknowledged: boolean;
  acknowledgedAt: string | null;
  createdAt: string;
}

//  Medication 
export interface Medication {
  id: string;
  userId: string;
  name: string;
  dosage: string;
  frequency: "once_daily" | "twice_daily" | "three_times_daily" | "weekly" | "as_needed";
  scheduledTimes: string[];
  startDate: string;
  endDate: string | null;
  isActive: boolean;
  reminderEnabled: boolean;
  notes: string | null;
  color: string | null;
}

//  Caregiver 
export interface Caregiver {
  id: string;
  patientId: string;
  name: string;
  email: string | null;
  phoneNumber: string;
  relationship: string | null;
  shareToken: string | null;
  tokenExpiresAt: string | null;
  isActive: boolean;
}

// Navigation 
// defines what parameters each screen accepts
export type RootStackParamList = {
  Login: undefined;
  // undefined = this screen takes no parameters
  Signup: undefined;
};

export type MainTabParamList = {
  Dashboard: undefined;
  ECG: undefined;
  History: undefined;
  AI: undefined;
  Profile: undefined;
};

// API 
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  count?: number;
}

//  Form errors 
export type FormErrors<T> = Partial<Record<keyof T, string>>;
