import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

let geminiClient;

const getGeminiClient = () => {
  if (geminiClient) return geminiClient;

  console.log("Checking Gemini API key...");

  if (!process.env.GEMINI_API_KEY) {
    console.warn("GEMINI_API_KEY missing — AI suggestions disabled");
    return null;
  }

  console.log(
    "Gemini key found:",
    `${process.env.GEMINI_API_KEY.substring(0, 10)}...`
  );

  geminiClient = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
  });

  console.log("Gemini client created successfully");

  return geminiClient;
};

export const generateAIResponse = async (prompt) => {
  console.log("Generating AI response with Gemini API...");

  const client = getGeminiClient();

  if (!client) {
    console.log("No Gemini client");
    return "AI suggestions unavailable, API key not configured";
  }

  try {
    console.log("Sending prompt to Gemini...");

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    console.log("Gemini response received");

    console.log("Gemini text:");
    console.log(response.text);

    return response.text;
  } catch (error) {
    console.error("Gemini API error:", error);

    if (error?.message?.toLowerCase().includes("quota")) {
      return "AI suggestions temporarily unavailable, daily quota reached";
    }

    if (error?.message?.toLowerCase().includes("api key")) {
      return "AI suggestions unavailable, Gemini API key is invalid";
    }

    throw error;
  }
};