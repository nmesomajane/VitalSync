import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

let geminiClient;

const getGeminiClient = () => {
  if (geminiClient) return geminiClient;
 

  if (!process.env.GEMINI_API_KEY) {
    console.warn("GEMINI_API_KEY missing — AI suggestions disabled");
    return null;
  }

  geminiClient = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  return geminiClient;
};

export const generateAIResponse = async (prompt) => {
  const client = getGeminiClient();

  if (!client) {
    return "AI suggestions unavailable , API key not configured";
  }

  try {
   const model = client.getGenerativeModel({ model: "gemini-2.0-flash" });
    
    const result = await model.generateContent(prompt);
   
    const response = await result.response;
    const text = response.text();
   

    return text;

  } catch (error) {
    console.error("Gemini API error:", error.message);

    if (error.message.includes("quota")) {
      return "AI suggestions temporarily unavailable , daily quota reached";
  
    }

    throw error;
  }
};