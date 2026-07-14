import api from "./api";

// types 

export interface AIPattern {
  name: string;
  riskLevel: string;
  urgency: string;
 
}

export interface VitalsContext {
  averages: {
    heartRate: number | null;
    spO2: number | null;
    bodyTemperature: number | null;
    respiratoryRate: number | null;
    roomHumidity: number | null;
  };
  totalAnomalies: number;
  daysAnalysed: number;
}

export interface YouTubeVideo {
  videoId: string;
  title: string;
  channel: string;
  thumbnail: string;
  description: string;
  watchUrl: string;
  publishedAt: string;
}

export interface AISuggestions {
  pattern: AIPattern;
  vitalsContext: VitalsContext;
  suggestions: string;
  videos: YouTubeVideo[];
  generatedAt: string;
  nextRefreshAt: string;
}

export interface ParsedSuggestions {
  mealPlan: {
    breakfast: string;
    lunch: string;
    dinner: string;
    snack: string;
  };
  routine: {
    morning: string;
    afternoon: string;
    evening: string;
    sleep: string;
  };
  warnings: string[];
  
}


export const fetchConsentStatus = async (): Promise<boolean> => {
  console.log("aiService: fetching consent status");

  try {
    const response = await api.get("/api/v1/auth/profile");
   
    const consent = response.data.user?.aiDataConsent ?? false;
    console.log("aiService: consent status:", consent);
    return consent;

  } catch (error: any) {
    console.error("aiService: failed to fetch consent:", error.message);
    return false;
   
  }
};

//  update consent 
export const updateConsent = async (consent: boolean): Promise<void> => {
 

  console.log("aiService: updating consent to:", consent);

  await api.put("/api/v1/ai/consent", { consent });
 
};

//  fetch AI suggestions 
export const fetchAISuggestions = async (
  days: number = 7
): Promise<AISuggestions> => {


  console.log(`aiService: fetching AI suggestions for ${days} days`);

  const response = await api.post<{ success: boolean; data: AISuggestions }>(
    `/api/v1/ai/suggestions?days=${days}`

  );

  console.log(
    "aiService: suggestions received, pattern:",
    response.data.data?.pattern?.name
  );

  return response.data.data;
};

//  fetch YouTube videos only 
export const fetchVideos = async (topic?: string): Promise<YouTubeVideo[]> => {


  const url = topic
    ? `/api/v1/ai/videos?topic=${encodeURIComponent(topic)}`
    : "/api/v1/ai/videos";
 

  const response = await api.get(url);
  return response.data.data?.videos ?? [];
};