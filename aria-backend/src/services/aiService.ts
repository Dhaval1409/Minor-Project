// /**
//  * FILENAME: src/services/aiService.ts
//  *
//  * Uses the native Google Generative AI SDK directly so both the REST API 
//  * and the Telegram bot can share the exact same logic without LangChain 
//  * version conflicts.
//  */

// import { GoogleGenerativeAI } from "@google/generative-ai";
// import {
//   AIResponse,
//   BUSINESS_TYPES,
//   SERVICES_BY_BUSINESS_TYPE,
// } from "../models/appointmentModel";

// const SYSTEM_INSTRUCTIONS = `You are Aria, an AI appointment booking assistant.
// You support exactly these business types: ${BUSINESS_TYPES.join(", ")}.
// Services available per business type: ${JSON.stringify(
//   SERVICES_BY_BUSINESS_TYPE
// )}.

// From the user's message, extract:
// - intent: one of "book", "view", "cancel", "reschedule", "unknown"
// - businessType: one of ${BUSINESS_TYPES.join(", ")} (if mentioned or inferable)
// - service: the specific service being requested (if mentioned or inferable)
// - date: normalized date if mentioned (natural language is fine, e.g. "tomorrow", "next Monday")
// - time: normalized time if mentioned (e.g. "5 PM")
// - missingFields: list of fields still needed to complete the booking (e.g. ["date", "time"])
// - reply: a short, friendly natural language response to send back to the user

// Respond ONLY with strict JSON matching this shape, no markdown formatting, no code blocks, no commentary:
// {
//   "intent": "book" | "view" | "cancel" | "reschedule" | "unknown",
//   "businessType": string | null,
//   "service": string | null,
//   "date": string | null,
//   "time": string | null,
//   "missingFields": string[],
//   "reply": string
// }`;

// function getGenAIClient(): GoogleGenerativeAI {
//   const apiKey = process.env.GEMINI_API_KEY;
//   if (!apiKey) {
//     throw new Error(
//       "GEMINI_API_KEY is not set. Add it to your .env file to enable AI conversations."
//     );
//   }
//   return new GoogleGenerativeAI(apiKey);
// }

// function safeParseAIResponse(raw: string): AIResponse {
//   try {
//     const cleaned = raw.replace(/```json|```/g, "").trim();
//     const parsed = JSON.parse(cleaned);
//     return {
//       intent: parsed.intent ?? "unknown",
//       businessType: parsed.businessType ?? undefined,
//       service: parsed.service ?? undefined,
//       date: parsed.date ?? undefined,
//       time: parsed.time ?? undefined,
//       missingFields: parsed.missingFields ?? [],
//       reply:
//         parsed.reply ??
//         "Sorry, I didn't quite catch that. Could you rephrase?",
//     };
//   } catch {
//     return {
//       intent: "unknown",
//       reply:
//         "Sorry, I had trouble understanding that. Could you rephrase your request?",
//       missingFields: [],
//     };
//   }
// }

// /**
//  * Process a single natural language message and return a structured AIResponse.
//  */
// export async function processUserMessage(message: string): Promise<AIResponse> {
//   const ai = getGenAIClient();
  
//   // Use the standard model instance method for @google/generative-ai
//   const model = ai.getGenerativeModel({
//     model: "gemini-2.5-flash", 
//     generationConfig: {
//       responseMimeType: "application/json",
//       temperature: 0.2,
//     }
//   });

//   const prompt = `${SYSTEM_INSTRUCTIONS}\n\nUser message: "${message}"\n\nJSON response:`;
//   const result = await model.generateContent(prompt);
//   const response = await result.response;
//   const rawText = response.text();
  
//   return safeParseAIResponse(rawText);
// }


/**
 * FILENAME: src/services/aiService.ts
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import { AIResponse } from "../models/appointmentModel";

function getGenAIClient(): GoogleGenerativeAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set. Add it to your .env file.");
  }
  return new GoogleGenerativeAI(apiKey);
}

function safeParseAIResponse(raw: string): AIResponse {
  try {
    const cleaned = raw.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);
    return {
      intent: parsed.intent ?? "unknown",
      businessType: parsed.businessType ?? undefined,
      service: parsed.service ?? undefined,
      date: parsed.date ?? undefined,
      time: parsed.time ?? undefined,
      missingFields: parsed.missingFields ?? [],
      reply: parsed.reply ?? "Sorry, I didn't quite catch that. Could you rephrase?",
    };
  } catch {
    return {
      intent: "unknown",
      reply: "Sorry, I had trouble understanding that. Could you rephrase your request?",
      missingFields: [],
    };
  }
}

/**
 * Process a user message using dynamic multi-tenant business context
 */
export async function processUserMessage(message: string, businessContext: any): Promise<AIResponse> {
  const ai = getGenAIClient();
  const model = ai.getGenerativeModel({
    model: "gemini-2.5-flash", 
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.2,
    }
  });

  // Dynamically tailor Aria's instructions based on the specific onboarding data!
  const systemInstructions = `You are Aria, an AI appointment booking assistant for "${businessContext.name}".
You operate a business of type: "${businessContext.businessType}".
Services available at this shop: ${JSON.stringify(businessContext.servicesProvided || [])}.
Our working hours are: ${businessContext.hours?.opens || "10:00 AM"} to ${businessContext.hours?.closes || "8:00 PM"}.

From the user's message, extract:
- intent: one of "book", "view", "cancel", "reschedule", "unknown"
- businessType: the type of business
- service: the specific service being requested (if mentioned)
- date: normalized date if mentioned (e.g. "tomorrow", "next Monday")
- time: normalized time if mentioned (e.g. "3 PM")
- missingFields: list of fields still needed to complete the booking (e.g. ["date", "time"])
- reply: a short, friendly natural language response to send back to the user

Respond ONLY with strict JSON matching this shape:
{
  "intent": "book" | "view" | "cancel" | "reschedule" | "unknown",
  "businessType": string | null,
  "service": string | null,
  "date": string | null,
  "time": string | null,
  "missingFields": string[],
  "reply": string
}`;

  const prompt = `${systemInstructions}\n\nUser message: "${message}"\n\nJSON response:`;
  const result = await model.generateContent(prompt);
  const response = await result.response;
  return safeParseAIResponse(response.text());
}