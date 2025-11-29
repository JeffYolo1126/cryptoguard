import { GoogleGenAI, Type } from "@google/genai";
import { SYSTEM_INSTRUCTION } from "../constants";
import { AnalysisResult } from "../types";

// Initialize the client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const analysisSchema = {
  type: Type.OBJECT,
  properties: {
    summary: { type: Type.STRING },
    signal: { type: Type.STRING, enum: ["LONG", "SHORT", "WAIT"] },
    plan: {
      type: Type.OBJECT,
      properties: {
        entry: { type: Type.STRING },
        sl: { type: Type.STRING },
        tp1: { type: Type.STRING },
        tp2: { type: Type.STRING },
        logic: { type: Type.STRING },
      },
    },
    riskLevel: { type: Type.STRING, enum: ["LOW", "MEDIUM", "HIGH"] },
  },
  required: ["summary", "signal", "riskLevel"],
};

export const analyzeChart = async (
  promptText: string,
  imagesBase64?: string[]
): Promise<AnalysisResult> => {
  try {
    const parts: any[] = [];
    
    if (imagesBase64 && imagesBase64.length > 0) {
      imagesBase64.forEach((img) => {
        // Attempt to extract mimeType from the data URL, default to png if not found
        const mimeMatch = img.match(/^data:(image\/[a-zA-Z+]+);base64,/);
        const mimeType = mimeMatch ? mimeMatch[1] : "image/png";
        
        // Clean the base64 string generic regex to handle various image types
        const cleanBase64 = img.replace(/^data:image\/[a-zA-Z+]+;base64,/, "");
        
        parts.push({
          inlineData: {
            mimeType: mimeType,
            data: cleanBase64,
          },
        });
      });
    }

    parts.push({
      text: promptText || "请根据提供的框架分析这张图表。",
    });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: parts,
      },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
        temperature: 0.2, // Low temperature for consistent, analytical output
      },
    });

    const textResponse = response.text;
    if (!textResponse) {
      throw new Error("Gemini 返回内容为空");
    }

    const result = JSON.parse(textResponse) as AnalysisResult;
    return result;

  } catch (error) {
    console.error("Analysis Failed:", error);
    throw error;
  }
};