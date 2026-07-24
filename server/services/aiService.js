import { generateAIResponse } from "../config/gemini.js";
import { searchYouTubeVideos } from "../config/youtube.js";
import vitalsRepository from "../repository/vitalRepository.js";
import userRepository from "../repository/userRepository.js";
import AppError from "../utilis/appError.js";

const suggestionCache = new Map();
const CACHE_DURATION_MS = 6 * 60 * 60 * 1000;

class AIService {
  async getAISuggestions(userId, days = 7) {
    // consent check — must be first
    const user = await userRepository.findById(userId);
    if (!user) throw new AppError("User not found", 404);

    if (!user.aiDataConsent) {
      throw new AppError(
        "AI suggestions require data sharing consent. Enable this in your profile settings.",
        403,
      );
    }

    // fetch history
    const historyResult = await vitalsRepository.findDailyAverages(
      userId,
      days,
    );

    if (!historyResult || historyResult.length === 0) {
      throw new AppError(
        "Not enough health data to generate suggestions. Record at least one day of vitals first.",
        400,
      );
    }

    // calculate averages
    const averages = this.calculateOverallAverages(historyResult);
    const totalAnomalies = historyResult.reduce(
      (sum, day) => sum + parseInt(day.anomalyCount || 0),
      0,
    );
    const anomalyRate =
      totalAnomalies /
      historyResult.reduce(
        (sum, day) => sum + parseInt(day.totalReadings || 0),
        0,
      );

    // check cache
    if (this.isCacheValid(userId, totalAnomalies)) {
      console.log(`Returning cached AI suggestions for user ${userId}`);
      return suggestionCache.get(userId).data;
    }

    // classify pattern
    const pattern = this.classifyHealthPattern(averages, anomalyRate);

    // build prompt and call APIs
    const prompt = this.buildHealthPrompt(
      averages,
      pattern,
      totalAnomalies,
      days,
    );
    console.log(`Generating AI suggestions for pattern: ${pattern.pattern}`);

    const [aiResponse, videos] = await Promise.all([
      generateAIResponse(prompt),
      searchYouTubeVideos(this.buildVideoSearchQuery(pattern), 3),
    ]);

    // build result
    const result = {
      pattern: {
        name: pattern.pattern,
        riskLevel: pattern.riskLevel,
        urgency: pattern.urgency,
      },
      vitalsContext: {
        averages,
        totalAnomalies,
        daysAnalysed: historyResult.length,
      },
      suggestions: aiResponse,
      videos,
      generatedAt: new Date().toISOString(),
      nextRefreshAt: new Date(Date.now() + CACHE_DURATION_MS).toISOString(),
    };

    // store in cache
    suggestionCache.set(userId, {
      data: result,
      generatedAt: Date.now(),
      anomalyCount: totalAnomalies,
    });

    return result;
  }
  //  getAISuggestions closes here

  // video suggestions
  async getVideoSuggestions(userId, topic) {
    let searchQuery = topic;

    if (!topic) {
      const history = await vitalsRepository.findDailyAverages(userId, 7);
      if (history.length > 0) {
        const averages = this.calculateOverallAverages(history);
        const anomalyRate =
          history.reduce((sum, d) => sum + parseInt(d.anomalyCount || 0), 0) /
          history.length;
        const pattern = this.classifyHealthPattern(averages, anomalyRate);
        searchQuery = this.buildVideoSearchQuery(pattern);
      } else {
        searchQuery = "heart health monitoring tips";
      }
    }

    const videos = await searchYouTubeVideos(searchQuery, 5);
    return { videos, searchQuery };
  }
  // getVideoSuggestions closes here

  //  health pattern classifier
  classifyHealthPattern(averages, anomalyRate) {
    const { heartRate, spO2, bodyTemperature, respiratoryRate } = averages;

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

    if (respiratoryRate && respiratoryRate > 18) {
      return {
        pattern: "elevated_respiratory_rate",
        riskLevel: "moderate",
        focus: "breathing efficiency and stress levels",
        urgency: "Breathing rate above optimal range",
      };
    }

    if (
      heartRate &&
      heartRate > 80 &&
      spO2 &&
      spO2 < 97 &&
      anomalyRate > 0.15
    ) {
      return {
        pattern: "cardiorespiratory_strain",
        riskLevel: "moderate",
        focus: "cardiovascular and respiratory efficiency",
        urgency: "Mild strain pattern detected across multiple vitals",
      };
    }

    return {
      pattern: "normal_variation",
      riskLevel: "low",
      focus: "maintenance, prevention, and optimisation",
      urgency: "All vitals within healthy ranges",
    };
  }

  //  prompt builder
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
Respond ONLY with this exact format. Do not add headers, asterisks, or extra text.

MEAL PLAN:
Breakfast: [your recommendation here]
Lunch: [your recommendation here]
Dinner: [your recommendation here]
Snack: [your recommendation here]

DAILY ROUTINE:
Morning: [your recommendation here]
Afternoon: [your recommendation here]
Evening: [your recommendation here]
Sleep: [your recommendation here]

KEY WARNING SIGNS:
[List 2 specific symptoms to watch for given this patient's pattern]

IMPORTANT: Be specific to the patient's data. Do not give generic health advice.
If risk level is high, include a clear recommendation to consult a doctor.
Keep the entire response under 300 words.
    `.trim();
  }

  //  video query builder
  buildVideoSearchQuery(pattern) {
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
  }

  // cache check
  isCacheValid(userId, currentAnomalyCount) {
    const cached = suggestionCache.get(userId);
    if (!cached) return false;
    const ageMs = Date.now() - cached.generatedAt;
    if (ageMs > CACHE_DURATION_MS) return false;
    if (cached.anomalyCount !== currentAnomalyCount) return false;
    return true;
  }

  // averages calculator
  calculateOverallAverages(dailyData) {
    const metrics = [
      "avgHeartRate",
      "avgSpO2",
      "avgBodyTemperature",
      "avgRespiratoryRate",
      "avgRoomHumidity",
    ];

    const result = {};

    for (const metric of metrics) {
      const validValues = dailyData
        .map((day) => parseFloat(day[metric]))
        .filter((v) => !isNaN(v) && v > 0);

      const cleanKey = metric
        .replace("avg", "")
        .replace(/^\w/, (c) => c.toLowerCase());

      if (validValues.length === 0) {
        result[cleanKey] = null;
        continue;
      }

      const avg =
        validValues.reduce((sum, v) => sum + v, 0) / validValues.length;
      result[cleanKey] = parseFloat(avg.toFixed(1));
    }

    return result;
  }
}

export default new AIService();
