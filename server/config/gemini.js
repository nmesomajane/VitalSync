import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

let geminiClient;

const getGeminiClient = () => {
  if (geminiClient) return geminiClient;

  console.log("Gemini key:", process.env.GEMINI_API_KEY);
  console.log(
  "First 10 chars:",
  process.env.GEMINI_API_KEY?.substring(0, 10)
);

  if (!process.env.GEMINI_API_KEY) {
    console.warn("GEMINI_API_KEY missing — AI suggestions disabled");
    return null;
  }

  geminiClient = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  console.log("Gemini client created successfully");

  return geminiClient;
};

export const generateAIResponse = async (prompt) => {
  console.log("Generating AI response with Gemini API...");
  const client = getGeminiClient();

  console.log("client:", client);

  if (!client) {
    console.log("No Gemini client");
    return "AI suggestions unavailable , API key not configured";
  }

  try {
    console.log("getting model");
     const model = client.getGenerativeModel({
      model: "gemini-1.5-flash",
    });
    console.log("Prompt sent to Gemini:");
    console.log(prompt);

    const result = await model.generateContent(prompt);

    console.log("Gemini raw result:");
    console.dir(result, { depth: null });

    const response = result.response;

    console.log("Gemini response object:");
    console.dir(response, { depth: null });

    const text = response.text();

    console.log("Gemini text:");
    console.log(text);

    return text;
  } catch (error) {
    console.error("Gemini API error:", error.message);

    if (error.message.includes("quota")) {
      return "AI suggestions temporarily unavailable , daily quota reached";
    }

    throw error;
  }
};
