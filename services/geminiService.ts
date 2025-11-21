import { GoogleGenAI, Type } from "@google/genai";
import { ExtractedTimetableEntry } from "../types";

const apiKey = process.env.API_KEY || ''; // Ensure environment variable is set

export const parseTimetableImage = async (base64Image: string): Promise<ExtractedTimetableEntry[]> => {
  if (!apiKey) {
    console.error("API Key is missing");
    return [];
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/png", // Assuming PNG for simplicity, but robust apps check actual type
              data: base64Image
            }
          },
          {
            text: "Analyze this timetable/schedule image. Extract all class sessions. Return a JSON array where each item represents a session with day, start time (HH:MM format), end time (HH:MM format), subject, room name (if visible, else use 'General'), and teacher name (if visible)."
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              day: { type: Type.STRING, description: "Day of the week e.g., Monday" },
              startTime: { type: Type.STRING, description: "Start time in HH:MM 24h format" },
              endTime: { type: Type.STRING, description: "End time in HH:MM 24h format" },
              subject: { type: Type.STRING, description: "Course or Subject Name" },
              roomName: { type: Type.STRING, description: "Room identifier or 'TBD'" },
              teacherName: { type: Type.STRING, description: "Name of teacher if present" }
            },
            required: ["day", "startTime", "endTime", "subject", "roomName"]
          }
        }
      }
    });

    const text = response.text;
    if (!text) return [];
    
    const data = JSON.parse(text) as ExtractedTimetableEntry[];
    return data;

  } catch (error) {
    console.error("Error parsing timetable with Gemini:", error);
    throw error;
  }
};