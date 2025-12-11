import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateTaskSuggestions = async (projectDescription: string): Promise<any[]> => {
  if (!process.env.API_KEY) return [];

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Generate a list of 5 logical tasks for a project with this description: "${projectDescription}". 
      Return the response in JSON format.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              priority: { type: Type.STRING, enum: ["Low", "Medium", "High"] }
            },
            required: ["title", "description", "priority"]
          }
        }
      }
    });

    const text = response.text;
    if (!text) return [];
    return JSON.parse(text);
  } catch (error) {
    console.error("AI Task Generation Error:", error);
    return [];
  }
};

export const chatWithAI = async (history: { role: string, content: string }[], message: string) => {
  if (!process.env.API_KEY) return "AI Configuration Missing.";

  try {
    // Basic chat interface
    const chat = ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: "You are a helpful project management assistant named Nexus AI. You help users organize tasks, suggest workflows, and keep spirits high.",
      }
    });
    
    // In a real implementation, we would replay history. 
    // Here we just send the new message for simplicity in this demo context.
    const result = await chat.sendMessage({ message });
    return result.text;
  } catch (error) {
    console.error("AI Chat Error:", error);
    return "Sorry, I'm having trouble connecting to the server right now.";
  }
};