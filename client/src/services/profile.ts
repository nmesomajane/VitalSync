import api from "./api";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  age: number | null;
  gender: string | null;
  phoneNumber: string | null;
  aiDataConsent: boolean;
  fcmToken: string | null;
}

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  scheduledTimes: string[];
  startDate: string;
  endDate: string | null;
  isActive: boolean;
  reminderEnabled: boolean;
  notes: string | null;
  color: string | null;
}

export interface Caregiver {
  id: string;
  name: string;
  email: string | null;
  phoneNumber: string;
  relationship: string | null;
  isActive: boolean;
}

export const fetchProfile = async (): Promise<UserProfile> => {
  const res = await api.get("/api/v1/auth/profile");
  return res.data.user;
};

export const fetchMedications = async (): Promise<Medication[]> => {
  const res = await api.get("/api/v1/medications");
  return res.data.data ?? [];
};

export const addMedication = async (
  data: Partial<Medication>
): Promise<Medication> => {
  const res = await api.post("/api/v1/medications", data);
  return res.data.data;
};

export const deleteMedication = async (id: string): Promise<void> => {
  await api.delete(`/api/v1/medications/${id}`);
};

export const toggleMedicationReminder = async (id: string): Promise<Medication> => {
  const res = await api.patch(`/api/v1/medications/${id}/toggle-reminder`);
  return res.data.data;
};

export const fetchCaregivers = async (): Promise<Caregiver[]> => {
  const res = await api.get("/api/v1/caregivers");
  return res.data.data ?? [];
};

export const addCaregiver = async (
  data: Partial<Caregiver>
): Promise<Caregiver> => {
  const res = await api.post("/api/v1/caregivers", data);
  return res.data.data;
};

export const removeCaregiver = async (id: string): Promise<void> => {
  await api.delete(`/api/v1/caregivers/${id}`);
};

export const logout = async (): Promise<void> => {
  // no backend call needed — just clear local token
  // the backend uses stateless JWT — no session to invalidate
};