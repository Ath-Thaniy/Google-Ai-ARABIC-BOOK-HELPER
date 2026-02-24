import { GoogleGenAI, Type } from "@google/genai";
import { ProcessingResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function processArabicPdf(base64Data: string, pageNumber: number): Promise<ProcessingResult> {
  const model = "gemini-3-flash-preview";
  
  const prompt = `
    You are an expert Arabic linguist and translator. 
    Analyze the attached Arabic PDF book.
    
    TASK:
    1. Focus ONLY on page ${pageNumber} of the PDF.
    2. Transcribe the text from this page accurately.
    3. Ensure the Arabic text has COMPLETE TASHKEEL (vocalization/diacritics).
    4. Translate each sentence into clear English.
    5. If a sentence contains numbers (dates, quantities, etc.), provide the Arabic WORD pronunciation for those numbers with full tashkeel in a 'numberPronunciation' field.
    6. Determine if there is a next page (page ${pageNumber + 1}) in the document.
    
    OUTPUT FORMAT:
    Provide the output as a JSON object:
    {
      "title": "Book Title",
      "author": "Author Name",
      "content": [{"arabic": "...", "english": "...", "numberPronunciation": "optional string if numbers exist"}],
      "currentPage": ${pageNumber},
      "hasMore": true/false
    }
  `;

  const response = await ai.models.generateContent({
    model,
    contents: [
      {
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: "application/pdf",
              data: base64Data,
            },
          },
        ],
      },
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          author: { type: Type.STRING },
          content: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                arabic: { type: Type.STRING },
                english: { type: Type.STRING },
                numberPronunciation: { type: Type.STRING },
              },
              required: ["arabic", "english"],
            },
          },
          currentPage: { type: Type.INTEGER },
          hasMore: { type: Type.BOOLEAN },
        },
        required: ["content", "currentPage", "hasMore"],
      },
    },
  });

  try {
    return JSON.parse(response.text || "{}") as ProcessingResult;
  } catch (error) {
    console.error("Failed to parse Gemini response:", error);
    throw new Error("Failed to process the PDF content.");
  }
}
