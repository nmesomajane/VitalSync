import { useState, useEffect, useCallback } from "react";
import {
  fetchConsentStatus,
  updateConsent,
  fetchAISuggestions,
  AISuggestions,
  ParsedSuggestions,
  
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
      console.log("================");
console.log(data.suggestions);
console.log("================");

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



const parseGeminiResponse = (text: string): ParsedSuggestions => {
console.log("========== GEMINI RESPONSE ==========");
console.log(text);
console.log("====================================");
 

  const defaults: ParsedSuggestions = {
    mealPlan: {
      breakfast: "AI Temporary Unavailable",
      lunch: "AI Temporary Unavailable",
      dinner: "AI Temporary Unavailable",
      snack: "AI Temporary Unavailable",
    },
    routine: {
      morning: "AI Temporary Unavailable",
      afternoon: "AI Temporary Unavailable",
      evening: "AI Temporary Unavailable",
      sleep: "AI Temporary Unavailable",
    },
    warnings: [],
  };
  
  console.log("Received Gemini response:");
console.log(text);

  if (!text || text.trim().length === 0) return defaults;

  try {
   
    const extractField = (labels: string[]): string => {
      for (const label of labels) {
        // try "Label: value on same line"
        const sameLineRegex = new RegExp(
          `${label}[:\\s]+([^\\n]+)`,
          "i"
          // "i" = case insensitive
          // [^\\n]+ = everything until newline
        );
        const sameLineMatch = text.match(sameLineRegex);
        if (sameLineMatch?.[1]?.trim()) {
          return sameLineMatch[1].trim();
        }

        // try "Label:" followed by content on next line
        const nextLineRegex = new RegExp(
          `${label}[:\\s]*\\n+([^\\n]+)`,
          "i"
        );
        const nextLineMatch = text.match(nextLineRegex);
        if (nextLineMatch?.[1]?.trim()) {
          return nextLineMatch[1].trim();
        }
      }
      return "";
    };

  
    const breakfast = extractField([
      "\\*?\\*?Breakfast\\*?\\*?",
      "breakfast",
      "Morning meal",
    ]);

    const lunch = extractField([
      "\\*?\\*?Lunch\\*?\\*?",
      "lunch",
      "Midday meal",
      "Afternoon meal",
    ]);

    const dinner = extractField([
      "\\*?\\*?Dinner\\*?\\*?",
      "dinner",
      "Evening meal",
      "Supper",
    ]);

    const snack = extractField([
      "\\*?\\*?Snack\\*?\\*?",
      "snack",
      "Healthy snack",
      "In-between",
    ]);

    const morning = extractField([
      "\\*?\\*?Morning\\*?\\*?",
      "morning",
      "AM routine",
      "Wake up",
    ]);

    const afternoon = extractField([
      "\\*?\\*?Afternoon\\*?\\*?",
      "afternoon",
      "Midday routine",
    ]);

    const evening = extractField([
      "\\*?\\*?Evening\\*?\\*?",
      "evening",
      "PM routine",
    ]);

    const sleep = extractField([
      "\\*?\\*?Sleep\\*?\\*?",
      "sleep",
      "Bedtime",
      "Night routine",
      "Before bed",
    ]);

    // extract warnings
    const warningsSection = text.match(
      /(?:KEY WARNING|WARNING|WATCH FOR|SIGNS TO WATCH)[^:]*:?\s*([\s\S]*?)(?:\n\n|\n(?=[A-Z])|$)/i
    );

    const warnings: string[] = [];
    if (warningsSection?.[1]) {
      warningsSection[1]
        .split("\n")
        .map((l) => l.replace(/^[-•*\d.]\s*/, "").trim())
        .filter((l) => l.length > 10)
       
        .slice(0, 3)
        
        .forEach((w) => warnings.push(w));
    }

    const result: ParsedSuggestions = {
      mealPlan: {
        breakfast: breakfast || defaults.mealPlan.breakfast,
        lunch: lunch || defaults.mealPlan.lunch,
        dinner: dinner || defaults.mealPlan.dinner,
        snack: snack || defaults.mealPlan.snack,
      },
      routine: {
        morning: morning || defaults.routine.morning,
        afternoon: afternoon || defaults.routine.afternoon,
        evening: evening || defaults.routine.evening,
        sleep: sleep || defaults.routine.sleep,
      },
      warnings,
    };

    console.log("parseGeminiResponse: result:", {
      breakfast: result.mealPlan.breakfast.substring(0, 40),
      morning: result.routine.morning.substring(0, 40),
      warnings: warnings.length,
    });

    return result;

  } catch (err) {
    console.error("parseGeminiResponse failed:", err);
    return defaults;
  }
};
export { ParsedSuggestions };
