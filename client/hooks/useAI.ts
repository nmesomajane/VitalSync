import { useState, useEffect, useCallback } from "react";
import {
  fetchConsentStatus,
  updateConsent,
  fetchAISuggestions,
  AISuggestions,
  ParsedSuggestions,
  YouTubeVideo,
} from "../src/services/ai";

export interface AIHookResult {
  hasConsent: boolean;
  isConsentLoading: boolean;
  onGiveConsent: () => Promise<void>;
  onRevokeConsent: () => Promise<void>;

  
  suggestions: AISuggestions | null;
  parsedSuggestions: ParsedSuggestions | null;
  

 
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;

  
  refresh: () => void;
}

export const useAI = (): AIHookResult => {
  const [hasConsent, setHasConsent] = useState<boolean>(false);
  const [isConsentLoading, setIsConsentLoading] = useState<boolean>(true);
  

  const [suggestions, setSuggestions] = useState<AISuggestions | null>(null);
  const [parsedSuggestions, setParsedSuggestions] =
    useState<ParsedSuggestions | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  //  load consent status on mount 
  useEffect(() => {
    const checkConsent = async () => {
      console.log("useAI: checking consent status");
      setIsConsentLoading(true);

      try {
        const consent = await fetchConsentStatus();
        setHasConsent(consent);
        console.log("useAI: consent is", consent);
      } catch (err) {
        console.error("useAI: consent check failed:", err);
        setHasConsent(false);
        // default to false if check fails
      } finally {
        setIsConsentLoading(false);
      }
    };

    checkConsent();
  }, []);
 

  //  fetch suggestions when consent is confirmed 
  const loadSuggestions = useCallback(
    async (showRefresh: boolean = false) => {
      if (!hasConsent) {
        console.log("useAI: skipping fetch — no consent");
        return;
        
      }

      console.log("useAI: fetching AI suggestions");

      if (showRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      try {
        const data = await fetchAISuggestions(7);
        setSuggestions(data);

     
        const parsed = parseGeminiResponse(data.suggestions);
        setParsedSuggestions(parsed);

        console.log("useAI: suggestions loaded and parsed");

      } catch (err: any) {
        console.error("useAI: failed to load suggestions:", err.message);

        if (err.response?.status === 403) {
          setHasConsent(false);
          setError(null);
        } else if (err.response?.status === 400) {
          setError("Not enough health data yet. Record at least one day of vitals first.");
         
        } else {
          setError("Failed to load AI insights. Pull down to refresh.");
        }
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [hasConsent]
  );

  //  fetch suggestions whenever consent becomes true 
  useEffect(() => {
    if (hasConsent && !suggestions) {
   
      loadSuggestions();
    }
  }, [hasConsent, suggestions, loadSuggestions]);

  //consent actions 
  const onGiveConsent = async (): Promise<void> => {
    console.log("useAI: user giving consent");
    try {
      await updateConsent(true);
      
      setHasConsent(true);
    
    } catch (err) {
      console.error("useAI: consent update failed:", err);
    }
  };

  const onRevokeConsent = async (): Promise<void> => {
    console.log("useAI: user revoking consent");
    try {
      await updateConsent(false);
      setHasConsent(false);
      setSuggestions(null);
      setParsedSuggestions(null);
   
    } catch (err) {
      console.error("useAI: revoke consent failed:", err);
    }
  };

  return {
    hasConsent,
    isConsentLoading,
    onGiveConsent,
    onRevokeConsent,
    suggestions,
    parsedSuggestions,
    isLoading,
    isRefreshing,
    error,
    refresh: () => loadSuggestions(true),
  };
};

// ── Gemini response parser 

export const parseGeminiResponse = (text: string): ParsedSuggestions => {
  console.log("parseGeminiResponse: parsing response of length:", text.length);

  // default values — used when a section isn't found in the text
  const defaults: ParsedSuggestions = {
    mealPlan: {
      breakfast: "No recommendation available",
      lunch: "No recommendation available",
      dinner: "No recommendation available",
      snack: "No recommendation available",
    },
    routine: {
      morning: "No recommendation available",
      afternoon: "No recommendation available",
      evening: "No recommendation available",
      sleep: "No recommendation available",
    },
    warnings: [],
  };

  if (!text) return defaults;

  try {
   
    const extractLine = (label: string): string => {
      const regex = new RegExp(`${label}:\\s*(.+?)(?:\\n|$)`, "i");
    

      const match = text.match(regex);
      return match ? match[1].trim() : "";
   
    };

    const mealPlan = {
      breakfast: extractLine("Breakfast") || defaults.mealPlan.breakfast,
      lunch: extractLine("Lunch") || defaults.mealPlan.lunch,
      dinner: extractLine("Dinner") || defaults.mealPlan.dinner,
      snack: extractLine("Snack") || defaults.mealPlan.snack,
    };

    // parse daily routine 
    const routine = {
      morning: extractLine("Morning") || defaults.routine.morning,
      afternoon: extractLine("Afternoon") || defaults.routine.afternoon,
      evening: extractLine("Evening") || defaults.routine.evening,
      sleep: extractLine("Sleep") || defaults.routine.sleep,
    };

    // parse warning signs
    
    const warningsSection = text.match(
      /KEY WARNING SIGNS?:?\s*([\s\S]*?)(?:\n\n|$)/i
    );
  

    const warnings: string[] = [];
    if (warningsSection) {
      const lines = warningsSection[1]
        .split("\n")
        // split the section into individual lines
        .map((l) => l.replace(/^[-•*]\s*/, "").trim())
        
        .filter((l) => l.length > 0);
       
      warnings.push(...lines);
    }

    console.log("parseGeminiResponse: parsed successfully");
    return { mealPlan, routine, warnings };

  } catch (err) {
    console.error("parseGeminiResponse: parsing failed:", err);
    return defaults;
   
  }
};

export { ParsedSuggestions };
