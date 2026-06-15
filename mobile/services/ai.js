import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

const SYSTEM_PROMPT = `You are Prashworld AI, a helpful, friendly, and cool AI assistant built into the Prashworld social network. 
Prashworld is a social network for nature lovers and adventurers. Keep your answers concise, fun, and use emojis!`;

export const generateAIResponse = async (prompt) => {
  try {
    if (!API_KEY) throw new Error("Gemini API key is missing");
    
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
    const fullPrompt = `${SYSTEM_PROMPT}\n\nUser: ${prompt}\nAI:`;
    
    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("AI Error:", error);
    return "Oops! I encountered an error. Please try again later. 🍃";
  }
};
