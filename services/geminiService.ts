
import { GoogleGenAI } from "@google/genai";

export const askTeffAssistant = async (prompt: string, language: 'am' | 'en') => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are an expert in Ethiopian agriculture, specifically Teff. 
      The user is asking in ${language === 'am' ? 'Amharic' : 'English'}.
      Provide a helpful, polite, and concise answer about Teff quality, storage, or cooking tips.
      User prompt: ${prompt}`,
      config: {
        systemInstruction: "Expert Teff advisor for TeffExpo marketplace. Be helpful and traditional yet professional.",
      }
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return language === 'am' 
      ? "ይቅርታ፣ አሁን ረዳቱን ማግኘት አልተቻለም።" 
      : "Sorry, the assistant is currently unavailable.";
  }
};
