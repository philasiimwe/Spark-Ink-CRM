

import { GoogleGenAI, Type } from "@google/genai";
import { Deal, Activity, Contact } from "./types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function getDealInsights(deal: Deal, activities: Activity[], contact: Contact) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      // Fix: Corrected typo JSON.id to deal.id in the prompt template
      contents: `You are an expert sales assistant. Analyze this deal and provide insights.
      Deal: ${deal.id} - ${deal.title}
      Value: ${deal.currency}${deal.value}
      Stage: ${deal.stage}
      Contact: ${contact.name} (${contact.company})
      Activities: ${activities.map(a => `${a.type}: ${a.subject} (${a.dueDate})`).join(', ')}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING, description: "One paragraph summary of the deal status" },
            riskLevel: { type: Type.STRING, enum: ["Low", "Medium", "High"] },
            nextSteps: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "Top 3 recommended actions"
            },
            suggestedEmailDraft: { type: Type.STRING, description: "A personalized follow-up email draft" }
          },
          required: ["summary", "riskLevel", "nextSteps", "suggestedEmailDraft"]
        }
      }
    });

    // Fix: Use the .text property (not a method) and handle potential undefined values
    const text = response.text;
    return text ? JSON.parse(text) : null;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return null;
  }
}

export async function getSalesForecast(deals: Deal[]) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyze these deals and provide a brief forecast summary: ${JSON.stringify(deals)}`,
      config: {
        systemInstruction: "You are a sales director. Provide a 2-sentence executive summary of the pipeline health."
      }
    });
    // Fix: Access response.text as a property
    return response.text || "Unable to generate forecast at this time.";
  } catch (error) {
    console.error("Forecast Error:", error);
    return "Unable to generate forecast at this time.";
  }
}
