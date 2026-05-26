import { generateAIResponse } from "../config/gemini.js";
import { searchYouTubeVideos } from "../config/youtube.js";
import vitalsRepository from "../repository/vitalRepository.js";
import AppError from "../utilis/appError.js";



const suggestionCache = new Map();
const CACHE_DURATION_MS = 6 * 60 * 60 * 1000;

// AI suggestions are recalculated every 6 hours maximum or immediately if vitals change significantly

class AIService {

    async getAISuggestions(userId, days = 7) {
  // check consent before doing anything
  const user = await userRepository.findById(userId);

  if (!user.aiDataConsent) {
    throw new AppError(
      "AI suggestions require data sharing consent. Enable this in your profile settings.",
      403
      // 403 = Forbidden — not an auth error, a consent error
    );
  }

 
}

  // your own rule-based AI — classifies patterns from averages

  classifyHealthPattern(averages, anomalyRate) {
    const { heartRate, spO2, bodyTemperature, respiratoryRate } = averages;

    // critical patterns — check these first
    if (spO2 && spO2 < 93) {
      return {
        pattern: "hypoxemia",
        riskLevel: "high",
        focus: "blood oxygen levels and respiratory function",
        urgency: "This pattern requires medical attention",
      };
    }

    if (bodyTemperature && bodyTemperature > 38.0) {
      return {
        pattern: "persistent_fever",
        riskLevel: "high",
        focus: "immune response and body temperature regulation",
        urgency: "Persistent elevated temperature — consult a doctor",
      };
    }

    // cardiovascular patterns
    if (heartRate && heartRate > 90 && anomalyRate > 0.25) {
      return {
        pattern: "sustained_tachycardia",
        riskLevel: "elevated",
        focus: "cardiovascular stress and nervous system regulation",
        urgency: "Consistently elevated heart rate detected",
      };
    }

    if (heartRate && heartRate < 62) {
      return {
        pattern: "bradycardia_tendency",
        riskLevel: "monitor",
        focus: "cardiac output and circulation",
        urgency: "Lower than normal heart rate — monitor closely",
      };
    }

    // respiratory patterns
    if (respiratoryRate && respiratoryRate > 18) {
      return {
        pattern: "elevated_respiratory_rate",
        riskLevel: "moderate",
        focus: "breathing efficiency and stress levels",
        urgency: "Breathing rate above optimal range",
      };
    }

    // combined mild elevation
    if (
      heartRate && heartRate > 80 &&
      spO2 && spO2 < 97 &&
      anomalyRate > 0.15
    ) {
      return {
        pattern: "cardiorespiratory_strain",
        riskLevel: "moderate",
        focus: "cardiovascular and respiratory efficiency",
        urgency: "Mild strain pattern detected across multiple vitals",
      };
    }

    // everything normal
    return {
      pattern: "normal_variation",
      riskLevel: "low",
      focus: "maintenance, prevention, and optimisation",
      urgency: "All vitals within healthy ranges",
    };
  }

  //  build the AI prompt


  buildHealthPrompt(averages, pattern, anomalyCount, days) {
    return `
You are a clinical health advisor reviewing a patient's wearable health monitoring data.

PATIENT DATA SUMMARY (last ${days} days):
- Average Heart Rate: ${averages.heartRate ?? "unavailable"} bpm
- Average SpO₂: ${averages.spO2 ?? "unavailable"}%
- Average Body Temperature: ${averages.bodyTemperature ?? "unavailable"}°C
- Average Respiratory Rate: ${averages.respiratoryRate ?? "unavailable"}/min
- Average Room Humidity: ${averages.roomHumidity ?? "unavailable"}%
- Total anomalies detected: ${anomalyCount} readings outside safe range

PATTERN CLASSIFICATION:
- Identified pattern: ${pattern.pattern}
- Risk level: ${pattern.riskLevel}
- Clinical focus: ${pattern.focus}
- Assessment: ${pattern.urgency}

INSTRUCTIONS:
Based ONLY on the specific data above, provide exactly the following in this format:

MEAL PLAN:
Breakfast: [specific food recommendation with reason tied to the data]
Lunch: [specific food recommendation with reason tied to the data]
Dinner: [specific food recommendation with reason tied to the data]
Snack: [one healthy snack targeting the identified pattern]

DAILY ROUTINE:
Morning: [specific activity with time, targeting the clinical focus]
Afternoon: [specific activity with time]
Evening: [specific activity with time, addressing the pattern]
Sleep: [specific recommendation for sleep quality]

KEY WARNING SIGNS:
[List 2 specific symptoms to watch for given this patient's pattern]

IMPORTANT: Be specific to the patient's data. Do not give generic health advice.
If risk level is high, include a clear recommendation to consult a doctor.
Keep the entire response under 300 words.
    `.trim();
   
  }

  
  buildVideoSearchQuery(pattern, anomalyMetric) {
    // creates targeted search queries based on what's wrong


    const queries = {
      sustained_tachycardia: "how to lower resting heart rate naturally",
      bradycardia_tendency: "foods and exercises for healthy heart rate",
      hypoxemia: "breathing exercises to improve blood oxygen levels",
      persistent_fever: "foods that help reduce fever and boost immunity",
      elevated_respiratory_rate: "diaphragmatic breathing techniques calm",
      cardiorespiratory_strain: "cardio exercises for heart and lung health",
      normal_variation: "heart rate variability improvement exercises",
    };

    return queries[pattern.pattern] || "cardiovascular health improvement tips";
    // fallback to a general health query if pattern not mapped
  }

  // check if cache is still valid
  isCacheValid(userId, currentAnomalyCount) {
    const cached = suggestionCache.get(userId);
    if (!cached) return false;

    const ageMs = Date.now() - cached.generatedAt;
    if (ageMs > CACHE_DURATION_MS) return false;
    // cache expired — older than 6 hours

    if (cached.anomalyCount !== currentAnomalyCount) return false;
    // anomaly count changed — new significant event happened
    // regenerate suggestions with updated context

    return true;
  }

  

  //  main method — get AI suggestions 
  async getAISuggestions(userId, days = 7) {
    //  fetch history data from database
    const historyResult = await vitalsRepository.findDailyAverages(userId, days);

    if (!historyResult || historyResult.length === 0) {
      throw new AppError(
        "Not enough health data to generate suggestions. Record at least one day of vitals first.",
        400
      );
    }

    //  calculate overall averages from daily averages
    const averages = this.calculateOverallAverages(historyResult);
    const totalAnomalies = historyResult.reduce(
      (sum, day) => sum + parseInt(day.anomalyCount || 0), 0
    );
    const anomalyRate = totalAnomalies / historyResult.reduce(
      (sum, day) => sum + parseInt(day.totalReadings || 0), 0
    );

    //  check cache — avoid unnecessary Gemini API calls
    if (this.isCacheValid(userId, totalAnomalies)) {
      console.log(`Returning cached AI suggestions for user ${userId}`);
      return suggestionCache.get(userId).data;
      // return cached data — saves API quota and is faster
    }

    //  classify the health pattern
    const pattern = this.classifyHealthPattern(averages, anomalyRate);

    //  build and send the prompt to Gemini
    const prompt = this.buildHealthPrompt(averages, pattern, totalAnomalies, days);

    console.log(`Generating AI suggestions for pattern: ${pattern.pattern}`);

    const [aiResponse, videos] = await Promise.all([
      generateAIResponse(prompt),
      // call Gemini with the structured prompt

      searchYouTubeVideos(
        this.buildVideoSearchQuery(pattern),
        3
        // fetch 3 relevant YouTube videos simultaneously
       
      ),
    ]);

    //  structure the final response
    const result = {
      pattern: {
        name: pattern.pattern,
        riskLevel: pattern.riskLevel,
        urgency: pattern.urgency,
        // these go on the "AI Brief" card at the top of the screen
      },

      vitalsContext: {
      
        averages,
        totalAnomalies,
        daysAnalysed: historyResult.length,
      },

      suggestions: aiResponse,
     

      videos,
    

      generatedAt: new Date().toISOString(),
      // timestamp shown to user: "Generated 2 hours ago"

      nextRefreshAt: new Date(
        Date.now() + CACHE_DURATION_MS
      ).toISOString(),
      // tells the app when to fetch fresh suggestions
    };

    //  store in cache
    suggestionCache.set(userId, {
      data: result,
      generatedAt: Date.now(),
      anomalyCount: totalAnomalies,
    });

    return result;
  }

  //get videos only (separate endpoint) 
  async getVideoSuggestions(userId, topic) {
    // allows the app to search videos for a specific topic
  

    let searchQuery = topic;

    if (!topic) {
     
      const history = await vitalsRepository.findDailyAverages(userId, 7);
      if (history.length > 0) {
        const averages = this.calculateOverallAverages(history);
        const anomalyRate = history.reduce(
          (sum, d) => sum + parseInt(d.anomalyCount || 0), 0
        ) / history.length;
        const pattern = this.classifyHealthPattern(averages, anomalyRate);
        searchQuery = this.buildVideoSearchQuery(pattern);
      } else {
        searchQuery = "heart health monitoring tips";
   
      }
    }

    const videos = await searchYouTubeVideos(searchQuery, 5);
    

    return { videos, searchQuery };
  }

  //  helper: calculate overall averages 
  calculateOverallAverages(dailyData) {
    const metrics = [
      "avgHeartRate", "avgSpO2",
      "avgBodyTemperature", "avgRespiratoryRate", "avgRoomHumidity"
    ];

    const result = {};

    for (const metric of metrics) {
      const validValues = dailyData
        .map(day => parseFloat(day[metric]))
        .filter(v => !isNaN(v) && v > 0);
        // filter out null/undefined/0 values
       

      if (validValues.length === 0) {
        result[metric.replace("avg", "").replace(/^\w/, c => c.toLowerCase())] = null;
        continue;
      }

      const avg = validValues.reduce((sum, v) => sum + v, 0) / validValues.length;

      // convert "avgHeartRate" key to "heartRate" for cleaner response
      const cleanKey = metric.replace("avg", "").replace(/^\w/, c => c.toLowerCase());
      result[cleanKey] = parseFloat(avg.toFixed(1));
    }

    return result;
  
  }
}

export default new AIService();