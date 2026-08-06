// /**
//  * FILENAME: src/services/aiService.ts
//  */

// import { GoogleGenerativeAI } from "@google/generative-ai";
// import { AIResponse } from "../models/appointmentModel";

// function getGenAIClient(): GoogleGenerativeAI {
//   const apiKey = process.env.GEMINI_API_KEY;
//   if (!apiKey) {
//     throw new Error("GEMINI_API_KEY is not set. Add it to your .env file.");
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
//       reply: parsed.reply ?? "Sorry, I didn't quite catch that. Could you rephrase?",
//     };
//   } catch {
//     return {
//       intent: "unknown",
//       reply: "Sorry, I had trouble understanding that. Could you rephrase your request?",
//       missingFields: [],
//     };
//   }
// }

// /**
//  * Pull the services list out of businessContext no matter which field name
//  * the caller used to populate it (services / servicesProvided / serviceList / inventory),
//  * and no matter whether it was stored as an array or a raw comma-separated string.
//  */
// function normalizeServices(businessContext: any): string[] {
//   const raw =
//     businessContext?.servicesProvided ??
//     businessContext?.services ??
//     businessContext?.serviceList ??
//     businessContext?.inventory ??
//     [];

//   if (Array.isArray(raw)) {
//     return raw.map((s) => String(s).trim()).filter(Boolean);
//   }
//   if (typeof raw === "string") {
//     return raw.split(",").map((s) => s.trim()).filter(Boolean);
//   }
//   return [];
// }

// /**
//  * Same idea for opening/closing hours — normalize whichever shape the
//  * caller passed (nested `hours.opens/closes` vs flat `openingHours/closingHours`).
//  */
// function normalizeHours(businessContext: any): { opens: string; closes: string } {
//   const opens =
//     businessContext?.hours?.opens ??
//     businessContext?.openingHours ??
//     "10:00 AM";
//   const closes =
//     businessContext?.hours?.closes ??
//     businessContext?.closingHours ??
//     "8:00 PM";
//   return { opens, closes };
// }

// function sleep(ms: number): Promise<void> {
//   return new Promise((resolve) => setTimeout(resolve, ms));
// }

// // ---------------------------------------------------------------------------
// // FAST PATH: answer "what services do you offer" style questions directly,
// // without spending a Gemini API call at all.
// // ---------------------------------------------------------------------------
// const SERVICES_QUESTION_PATTERN =
//   /\b(what|which)\b.*\b(service|services|product|products|offer|provide|menu|sell)\b|^(services|menu|price list)$/i;

// function tryFastPathServicesAnswer(message: string, businessContext: any): AIResponse | null {
//   if (!SERVICES_QUESTION_PATTERN.test(message.trim())) return null;

//   const services = normalizeServices(businessContext);
//   const shopName = businessContext?.name || "us";

//   const reply =
//     services.length > 0
//       ? `Here's what ${shopName} offers:\n\n${services.map((s) => `• ${s}`).join("\n")}\n\nWant to book one of these?`
//       : `We haven't listed our services yet — but you're welcome to ask me to book an appointment and I'll note down what you need!`;

//   return {
//     intent: "list_services" as any,
//     businessType: businessContext?.businessType,
//     service: undefined,
//     date: undefined,
//     time: undefined,
//     missingFields: [],
//     reply,
//   };
// }

// // ---------------------------------------------------------------------------
// // QUEUE + RETRY LAYER
// // ---------------------------------------------------------------------------

// interface QueueTask {
//   message: string;
//   businessContext: any;
//   resolve: (value: AIResponse) => void;
//   reject: (err: any) => void;
// }

// const MIN_GAP_MS = 15000;

// let lastCallAt = 0;
// let queue: QueueTask[] = [];
// let draining = false;

// function extractRetryDelayMs(err: any): number | null {
//   try {
//     const detail = err?.errorDetails?.find(
//       (d: any) => d["@type"] === "type.googleapis.com/google.rpc.RetryInfo"
//     );
//     const raw = detail?.retryDelay;
//     if (!raw) return null;
//     const seconds = parseFloat(String(raw).replace("s", ""));
//     return Number.isFinite(seconds) ? Math.ceil(seconds * 1000) : null;
//   } catch {
//     return null;
//   }
// }

// async function callGeminiOnce(message: string, businessContext: any): Promise<AIResponse> {
//   const ai = getGenAIClient();
//   const model = ai.getGenerativeModel({
//     model: "gemini-2.5-flash",
//     generationConfig: {
//       responseMimeType: "application/json",
//       temperature: 0.2,
//     },
//   });

//   const services = normalizeServices(businessContext);
//   const hours = normalizeHours(businessContext);

//   const servicesLine =
//     services.length > 0
//       ? `Services available at this shop: ${services.join(", ")}.`
//       : `No services have been configured for this shop yet.`;

//   const todayIso = new Date().toISOString().split("T")[0];

//   const systemInstructions = `You are Aria, an AI appointment booking assistant for "${businessContext.name}".
// You operate a business of type: "${businessContext.businessType}".
// ${servicesLine}
// Our working hours are: ${hours.opens} to ${hours.closes}.
// Today's date is ${todayIso} (YYYY-MM-DD format).

// STRICT RULES — follow these exactly, do not improvise:
// 1. If the user asks what services/products are offered, you MUST set intent to "list_services" and your reply MUST list every item from the services array above, verbatim. NEVER say "I don't have a list of services" if the services array above is non-empty.
// 2. Only say services are unavailable if the services array above is genuinely empty.
// 3. When booking, only accept a service name that matches (or closely matches) one of the listed services. If the requested service is not in the list, tell the user it isn't offered and show them the actual list so they can pick a valid one.
// 4. Keep replies short, warm, and specific to "${businessContext.name}".
// 5. "date" MUST ALWAYS be output in strict ISO format "YYYY-MM-DD". Resolve any relative term ("today", "tomorrow", "next Monday", "in 3 days") into an actual date using today's date (${todayIso}) above. NEVER output a relative phrase like "tomorrow" directly in the "date" field.
// 6. "time" MUST ALWAYS be output in strict 24-hour "HH:MM" format (e.g. "15:00" for 3 PM, "09:30" for 9:30 AM). NEVER output "3 PM" or "12 PM" directly in the "time" field — convert it first.

// From the user's message, extract:
// - intent: one of "book", "view", "cancel", "reschedule", "list_services", "unknown"
// - businessType: the type of business
// - service: the specific service being requested (if mentioned)
// - date: the appointment date, strictly as "YYYY-MM-DD" per rule 5 above
// - time: the appointment time, strictly as 24-hour "HH:MM" per rule 6 above
// - missingFields: list of fields still needed to complete the booking (e.g. ["date", "time"])
// - reply: a short, friendly natural language response to send back to the user

// Respond ONLY with strict JSON matching this shape:
// {
//   "intent": "book" | "view" | "cancel" | "reschedule" | "list_services" | "unknown",
//   "businessType": string | null,
//   "service": string | null,
//   "date": string | null,
//   "time": string | null,
//   "missingFields": string[],
//   "reply": string
// }`;

//   const prompt = `${systemInstructions}\n\nUser message: "${message}"\n\nJSON response:`;
//   const result = await model.generateContent(prompt);
//   const response = await result.response;
//   return safeParseAIResponse(response.text());
// }

// async function callGeminiWithRetry(
//   message: string,
//   businessContext: any,
//   attempt = 0
// ): Promise<AIResponse> {
//   try {
//     return await callGeminiOnce(message, businessContext);
//   } catch (err: any) {
//     const is429 = err?.status === 429;
//     if (is429 && attempt < 2) {
//       const suggested = extractRetryDelayMs(err);
//       const delay = suggested ?? (attempt === 0 ? 15000 : 30000);
//       console.warn(`⏳ [aiService] Gemini rate-limited. Retrying in ${Math.round(delay / 1000)}s (attempt ${attempt + 1}/2)...`);
//       await sleep(delay);
//       return callGeminiWithRetry(message, businessContext, attempt + 1);
//     }
//     throw err;
//   }
// }

// async function drainQueue() {
//   if (draining) return;
//   draining = true;

//   while (queue.length > 0) {
//     const task = queue.shift()!;
//     const elapsed = Date.now() - lastCallAt;
//     const wait = Math.max(0, MIN_GAP_MS - elapsed);
//     if (wait > 0) await sleep(wait);

//     try {
//       const result = await callGeminiWithRetry(task.message, task.businessContext);
//       lastCallAt = Date.now();
//       task.resolve(result);
//     } catch (err) {
//       lastCallAt = Date.now();
//       task.reject(err);
//     }
//   }

//   draining = false;
// }

// function enqueueGeminiCall(message: string, businessContext: any): Promise<AIResponse> {
//   return new Promise((resolve, reject) => {
//     queue.push({ message, businessContext, resolve, reject });
//     drainQueue();
//   });
// }

// /**
//  * Process a user message using dynamic multi-tenant business context
//  */
// export async function processUserMessage(message: string, businessContext: any): Promise<AIResponse> {
//   const fastAnswer = tryFastPathServicesAnswer(message, businessContext);
//   if (fastAnswer) return fastAnswer;

//   try {
//     return await enqueueGeminiCall(message, businessContext);
//   } catch (err: any) {
//     if (err?.status === 429) {
//       return {
//         intent: "unknown",
//         reply: "We're getting a lot of messages right now! Please try again in about a minute. 🙏",
//         missingFields: [],
//       };
//     }
//     throw err;
//   }
// }
//#---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
/**
 * FILENAME: src/services/aiService.ts
 */

// import { GoogleGenerativeAI } from "@google/generative-ai";
// import { AIResponse } from "../models/appointmentModel";

// // ---------------------------------------------------------------------------
// // PROVIDER SWITCH
// // Set AI_PROVIDER=gemini or AI_PROVIDER=openrouter in .env to switch.
// // Defaults to "gemini" if not set, so nothing breaks if you forget to add it.
// // ---------------------------------------------------------------------------
// type AIProvider = "gemini" | "openrouter";

// function getActiveProvider(): AIProvider {
//   const raw = (process.env.AI_PROVIDER || "gemini").toLowerCase();
//   return raw === "openrouter" ? "openrouter" : "gemini";
// }

// function getGenAIClient(): GoogleGenerativeAI {
//   const apiKey = process.env.GEMINI_API_KEY;
//   if (!apiKey) {
//     throw new Error("GEMINI_API_KEY is not set. Add it to your .env file.");
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
//       reply: parsed.reply ?? "Sorry, I didn't quite catch that. Could you rephrase?",
//     };
//   } catch {
//     return {
//       intent: "unknown",
//       reply: "Sorry, I had trouble understanding that. Could you rephrase your request?",
//       missingFields: [],
//     };
//   }
// }

// /**
//  * Pull the services list out of businessContext no matter which field name
//  * the caller used to populate it (services / servicesProvided / serviceList / inventory),
//  * and no matter whether it was stored as an array or a raw comma-separated string.
//  */
// function normalizeServices(businessContext: any): string[] {
//   const raw =
//     businessContext?.servicesProvided ??
//     businessContext?.services ??
//     businessContext?.serviceList ??
//     businessContext?.inventory ??
//     [];

//   if (Array.isArray(raw)) {
//     return raw.map((s) => String(s).trim()).filter(Boolean);
//   }
//   if (typeof raw === "string") {
//     return raw.split(",").map((s) => s.trim()).filter(Boolean);
//   }
//   return [];
// }

// /**
//  * Same idea for opening/closing hours — normalize whichever shape the
//  * caller passed (nested `hours.opens/closes` vs flat `openingHours/closingHours`).
//  */
// function normalizeHours(businessContext: any): { opens: string; closes: string } {
//   const opens =
//     businessContext?.hours?.opens ??
//     businessContext?.openingHours ??
//     "10:00 AM";
//   const closes =
//     businessContext?.hours?.closes ??
//     businessContext?.closingHours ??
//     "8:00 PM";
//   return { opens, closes };
// }

// function sleep(ms: number): Promise<void> {
//   return new Promise((resolve) => setTimeout(resolve, ms));
// }

// // ---------------------------------------------------------------------------
// // FAST PATH: answer "what services do you offer" style questions directly,
// // without spending an AI call at all.
// // ---------------------------------------------------------------------------
// const SERVICES_QUESTION_PATTERN =
//   /\b(what|which)\b.*\b(service|services|product|products|offer|provide|menu|sell)\b|^(services|menu|price list)$/i;

// function tryFastPathServicesAnswer(message: string, businessContext: any): AIResponse | null {
//   if (!SERVICES_QUESTION_PATTERN.test(message.trim())) return null;

//   const services = normalizeServices(businessContext);
//   const shopName = businessContext?.name || "us";

//   const reply =
//     services.length > 0
//       ? `Here's what ${shopName} offers:\n\n${services.map((s) => `• ${s}`).join("\n")}\n\nWant to book one of these?`
//       : `We haven't listed our services yet — but you're welcome to ask me to book an appointment and I'll note down what you need!`;

//   return {
//     intent: "list_services" as any,
//     businessType: businessContext?.businessType,
//     service: undefined,
//     date: undefined,
//     time: undefined,
//     missingFields: [],
//     reply,
//   };
// }

// /**
//  * Builds the exact same system prompt regardless of which provider is
//  * serving the request, so behavior stays identical when switching.
//  */
// function buildPrompt(message: string, businessContext: any): string {
//   const services = normalizeServices(businessContext);
//   const hours = normalizeHours(businessContext);

//   const servicesLine =
//     services.length > 0
//       ? `Services available at this shop: ${services.join(", ")}.`
//       : `No services have been configured for this shop yet.`;

//   const todayIso = new Date().toISOString().split("T")[0];

//   const systemInstructions = `You are Aria, an AI appointment booking assistant for "${businessContext.name}".
// You operate a business of type: "${businessContext.businessType}".
// ${servicesLine}
// Our working hours are: ${hours.opens} to ${hours.closes}.
// Today's date is ${todayIso} (YYYY-MM-DD format).

// STRICT RULES — follow these exactly, do not improvise:
// 1. If the user asks what services/products are offered, you MUST set intent to "list_services" and your reply MUST list every item from the services array above, verbatim. NEVER say "I don't have a list of services" if the services array above is non-empty.
// 2. Only say services are unavailable if the services array above is genuinely empty.
// 3. When booking, only accept a service name that matches (or closely matches) one of the listed services. If the requested service is not in the list, tell the user it isn't offered and show them the actual list so they can pick a valid one.
// 4. Keep replies short, warm, and specific to "${businessContext.name}".
// 5. "date" MUST ALWAYS be output in strict ISO format "YYYY-MM-DD". Resolve any relative term ("today", "tomorrow", "next Monday", "in 3 days") into an actual date using today's date (${todayIso}) above. NEVER output a relative phrase like "tomorrow" directly in the "date" field.
// 6. "time" MUST ALWAYS be output in strict 24-hour "HH:MM" format (e.g. "15:00" for 3 PM, "09:30" for 9:30 AM). NEVER output "3 PM" or "12 PM" directly in the "time" field — convert it first.

// From the user's message, extract:
// - intent: one of "book", "view", "cancel", "reschedule", "list_services", "unknown"
// - businessType: the type of business
// - service: the specific service being requested (if mentioned)
// - date: the appointment date, strictly as "YYYY-MM-DD" per rule 5 above
// - time: the appointment time, strictly as 24-hour "HH:MM" per rule 6 above
// - missingFields: list of fields still needed to complete the booking (e.g. ["date", "time"])
// - reply: a short, friendly natural language response to send back to the user

// Respond ONLY with strict JSON matching this shape, and nothing else — no preamble, no markdown fences:
// {
//   "intent": "book" | "view" | "cancel" | "reschedule" | "list_services" | "unknown",
//   "businessType": string | null,
//   "service": string | null,
//   "date": string | null,
//   "time": string | null,
//   "missingFields": string[],
//   "reply": string
// }`;

//   return `${systemInstructions}\n\nUser message: "${message}"\n\nJSON response:`;
// }

// // ---------------------------------------------------------------------------
// // GEMINI PROVIDER (untouched from your original working implementation)
// // ---------------------------------------------------------------------------
// async function callGeminiOnce(message: string, businessContext: any): Promise<AIResponse> {
//   const ai = getGenAIClient();
//   const model = ai.getGenerativeModel({
//     model: "gemini-2.5-flash",
//     generationConfig: {
//       responseMimeType: "application/json",
//       temperature: 0.2,
//     },
//   });

//   const prompt = buildPrompt(message, businessContext);
//   const result = await model.generateContent(prompt);
//   const response = await result.response;
//   return safeParseAIResponse(response.text());
// }

// // ---------------------------------------------------------------------------
// // OPENROUTER PROVIDER (new) — OpenAI-compatible chat completions API.
// // Model is configurable via OPENROUTER_MODEL in .env so you can swap models
// // without touching code, e.g. any free-tier model on openrouter.ai/models.
// // ---------------------------------------------------------------------------
// async function callOpenRouterOnce(message: string, businessContext: any): Promise<AIResponse> {
//   const apiKey = process.env.OPENROUTER_API_KEY;
//   if (!apiKey) {
//     throw new Error("OPENROUTER_API_KEY is not set. Add it to your .env file.");
//   }

//   const modelName = process.env.OPENROUTER_MODEL || "google/gemini-2.0-flash-exp:free";
//   const prompt = buildPrompt(message, businessContext);

//   const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//       Authorization: `Bearer ${apiKey}`,
//       // OpenRouter asks for these two headers for attribution/analytics — harmless to include.
//       "HTTP-Referer": "http://localhost:5000",
//       "X-Title": "Aria SaaS Backend",
//     },
//     body: JSON.stringify({
//       model: modelName,
//       messages: [{ role: "user", content: prompt }],
//       temperature: 0.2,
//       response_format: { type: "json_object" },
//     }),
//   });

//   if (!res.ok) {
//     const errText = await res.text().catch(() => "");
//     const err: any = new Error(`OpenRouter request failed: ${res.status} ${errText}`);
//     err.status = res.status; // mirrors the shape the retry logic below expects
//     throw err;
//   }

// const data: any = await res.json();
// const text = data?.choices?.[0]?.message?.content || "";
//   return safeParseAIResponse(text);
// }

// // ---------------------------------------------------------------------------
// // DISPATCH — routes to whichever provider is active. This is the ONLY place
// // that decides which implementation runs; everything above stays independent.
// // ---------------------------------------------------------------------------
// async function callProviderOnce(message: string, businessContext: any): Promise<AIResponse> {
//   const provider = getActiveProvider();
//   if (provider === "openrouter") {
//     return callOpenRouterOnce(message, businessContext);
//   }
//   return callGeminiOnce(message, businessContext);
// }

// // ---------------------------------------------------------------------------
// // QUEUE + RETRY LAYER (unchanged logic, now calls callProviderOnce instead of
// // being hardcoded to Gemini)
// // ---------------------------------------------------------------------------

// interface QueueTask {
//   message: string;
//   businessContext: any;
//   resolve: (value: AIResponse) => void;
//   reject: (err: any) => void;
// }

// // Free tier is 5 req/min on Gemini -> keep a safety margin, aim for ~4/min (15s gap).
// // OpenRouter free-tier models vary; 15s is still a safe default. Lower this
// // once you're on a paid plan with higher RPM, for either provider.
// const MIN_GAP_MS = 15000;

// let lastCallAt = 0;
// let queue: QueueTask[] = [];
// let draining = false;

// function extractRetryDelayMs(err: any): number | null {
//   try {
//     const detail = err?.errorDetails?.find(
//       (d: any) => d["@type"] === "type.googleapis.com/google.rpc.RetryInfo"
//     );
//     const raw = detail?.retryDelay; // e.g. "47s"
//     if (!raw) return null;
//     const seconds = parseFloat(String(raw).replace("s", ""));
//     return Number.isFinite(seconds) ? Math.ceil(seconds * 1000) : null;
//   } catch {
//     return null;
//   }
// }

// async function callProviderWithRetry(
//   message: string,
//   businessContext: any,
//   attempt = 0
// ): Promise<AIResponse> {
//   try {
//     return await callProviderOnce(message, businessContext);
//   } catch (err: any) {
//     const is429 = err?.status === 429;
//     if (is429 && attempt < 2) {
//       const suggested = extractRetryDelayMs(err);
//       const delay = suggested ?? (attempt === 0 ? 15000 : 30000);
//       console.warn(`⏳ [aiService/${getActiveProvider()}] Rate-limited. Retrying in ${Math.round(delay / 1000)}s (attempt ${attempt + 1}/2)...`);
//       await sleep(delay);
//       return callProviderWithRetry(message, businessContext, attempt + 1);
//     }
//     throw err;
//   }
// }

// async function drainQueue() {
//   if (draining) return;
//   draining = true;

//   while (queue.length > 0) {
//     const task = queue.shift()!;
//     const elapsed = Date.now() - lastCallAt;
//     const wait = Math.max(0, MIN_GAP_MS - elapsed);
//     if (wait > 0) await sleep(wait);

//     try {
//       const result = await callProviderWithRetry(task.message, task.businessContext);
//       lastCallAt = Date.now();
//       task.resolve(result);
//     } catch (err) {
//       lastCallAt = Date.now();
//       task.reject(err);
//     }
//   }

//   draining = false;
// }

// function enqueueProviderCall(message: string, businessContext: any): Promise<AIResponse> {
//   return new Promise((resolve, reject) => {
//     queue.push({ message, businessContext, resolve, reject });
//     drainQueue();
//   });
// }

// /**
//  * Process a user message using dynamic multi-tenant business context.
//  * Routes to Gemini or OpenRouter based on AI_PROVIDER in .env.
//  */
// export async function processUserMessage(message: string, businessContext: any): Promise<AIResponse> {
//   const fastAnswer = tryFastPathServicesAnswer(message, businessContext);
//   if (fastAnswer) return fastAnswer;

//   try {
//     return await enqueueProviderCall(message, businessContext);
//   } catch (err: any) {
//     if (err?.status === 429) {
//       return {
//         intent: "unknown",
//         reply: "We're getting a lot of messages right now! Please try again in about a minute. 🙏",
//         missingFields: [],
//       };
//     }
//     throw err;
//   }
// }

/**
 * FILENAME: src/services/aiService.ts
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import { AIResponse } from "../models/appointmentModel";

// ---------------------------------------------------------------------------
// PROVIDER SWITCH
// Set AI_PROVIDER=gemini, openrouter, or groq in .env to switch.
// Defaults to "gemini" if not set.
// ---------------------------------------------------------------------------
type AIProvider = "gemini" | "openrouter" | "groq";

function getActiveProvider(): AIProvider {
  const raw = (process.env.AI_PROVIDER || "gemini").toLowerCase();
  if (raw === "openrouter") return "openrouter";
  if (raw === "groq") return "groq";
  return "gemini";
}

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

function normalizeServices(businessContext: any): string[] {
  const raw =
    businessContext?.servicesProvided ??
    businessContext?.services ??
    businessContext?.serviceList ??
    businessContext?.inventory ??
    [];

  if (Array.isArray(raw)) {
    return raw.map((s) => String(s).trim()).filter(Boolean);
  }
  if (typeof raw === "string") {
    return raw.split(",").map((s) => s.trim()).filter(Boolean);
  }
  return [];
}

function normalizeHours(businessContext: any): { opens: string; closes: string } {
  const opens =
    businessContext?.hours?.opens ??
    businessContext?.openingHours ??
    "10:00 AM";
  const closes =
    businessContext?.hours?.closes ??
    businessContext?.closingHours ??
    "8:00 PM";
  return { opens, closes };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// FAST PATH: answer "what services do you offer" style questions directly,
// without spending an AI call at all.
// ---------------------------------------------------------------------------
const SERVICES_QUESTION_PATTERN =
  /\b(what|which)\b.*\b(service|services|product|products|offer|provide|menu|sell)\b|^(services|menu|price list)$/i;

function tryFastPathServicesAnswer(message: string, businessContext: any): AIResponse | null {
  if (!SERVICES_QUESTION_PATTERN.test(message.trim())) return null;

  const services = normalizeServices(businessContext);
  const shopName = businessContext?.name || "us";

  const reply =
    services.length > 0
      ? `Here's what ${shopName} offers:\n\n${services.map((s) => `• ${s}`).join("\n")}\n\nWant to book one of these?`
      : `We haven't listed our services yet — but you're welcome to ask me to book an appointment and I'll note down what you need!`;

  return {
    intent: "list_services" as any,
    businessType: businessContext?.businessType,
    service: undefined,
    date: undefined,
    time: undefined,
    missingFields: [],
    reply,
  };
}

/**
 * Builds the exact same system prompt regardless of which provider is
 * serving the request, so behavior stays identical when switching.
 */
function buildPrompt(message: string, businessContext: any): string {
  const services = normalizeServices(businessContext);
  const hours = normalizeHours(businessContext);

  const servicesLine =
    services.length > 0
      ? `Services available at this shop: ${services.join(", ")}.`
      : `No services have been configured for this shop yet.`;

  const todayIso = new Date().toISOString().split("T")[0];

  const systemInstructions = `You are Aria, an AI appointment booking assistant for "${businessContext.name}".
You operate a business of type: "${businessContext.businessType}".
${servicesLine}
Our working hours are: ${hours.opens} to ${hours.closes}.
Today's date is ${todayIso} (YYYY-MM-DD format).

STRICT RULES — follow these exactly, do not improvise:
1. If the user asks what services/products are offered, you MUST set intent to "list_services" and your reply MUST list every item from the services array above, verbatim. NEVER say "I don't have a list of services" if the services array above is non-empty.
2. Only say services are unavailable if the services array above is genuinely empty.
3. When booking, only accept a service name that matches (or closely matches) one of the listed services. If the requested service is not in the list, tell the user it isn't offered and show them the actual list so they can pick a valid one.
4. Keep replies short, warm, and specific to "${businessContext.name}".
5. "date" MUST ALWAYS be output in strict ISO format "YYYY-MM-DD". Resolve any relative term ("today", "tomorrow", "next Monday", "in 3 days") into an actual date using today's date (${todayIso}) above. NEVER output a relative phrase like "tomorrow" directly in the "date" field.
6. "time" MUST ALWAYS be output in strict 24-hour "HH:MM" format (e.g. "15:00" for 3 PM, "09:30" for 9:30 AM). NEVER output "3 PM" or "12 PM" directly in the "time" field — convert it first.

From the user's message, extract:
- intent: one of "book", "view", "cancel", "reschedule", "list_services", "unknown"
- businessType: the type of business
- service: the specific service being requested (if mentioned)
- date: the appointment date, strictly as "YYYY-MM-DD" per rule 5 above
- time: the appointment time, strictly as 24-hour "HH:MM" per rule 6 above
- missingFields: list of fields still needed to complete the booking (e.g. ["date", "time"])
- reply: a short, friendly natural language response to send back to the user

Respond ONLY with strict JSON matching this shape, and nothing else — no preamble, no markdown fences:
{
  "intent": "book" | "view" | "cancel" | "reschedule" | "list_services" | "unknown",
  "businessType": string | null,
  "service": string | null,
  "date": string | null,
  "time": string | null,
  "missingFields": string[],
  "reply": string
}`;

  return `${systemInstructions}\n\nUser message: "${message}"\n\nJSON response:`;
}

// ---------------------------------------------------------------------------
// GEMINI PROVIDER
// ---------------------------------------------------------------------------
async function callGeminiOnce(message: string, businessContext: any): Promise<AIResponse> {
  const ai = getGenAIClient();
  const model = ai.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.2,
    },
  });

  const prompt = buildPrompt(message, businessContext);
  const result = await model.generateContent(prompt);
  const response = await result.response;
  return safeParseAIResponse(response.text());
}

// ---------------------------------------------------------------------------
// OPENROUTER PROVIDER — OpenAI-compatible chat completions API.
// ---------------------------------------------------------------------------
async function callOpenRouterOnce(message: string, businessContext: any): Promise<AIResponse> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not set. Add it to your .env file.");
  }

  const modelName = process.env.OPENROUTER_MODEL || "google/gemma-4-31b-it:free";
  const prompt = buildPrompt(message, businessContext);

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": "http://localhost:5000",
      "X-Title": "Aria SaaS Backend",
    },
    body: JSON.stringify({
      model: modelName,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    const err: any = new Error(`OpenRouter request failed: ${res.status} ${errText}`);
    err.status = res.status;
    throw err;
  }

  const data: any = await res.json();
  const text = data?.choices?.[0]?.message?.content || "";
  return safeParseAIResponse(text);
}

// ---------------------------------------------------------------------------
// GROQ PROVIDER (new) — OpenAI-compatible chat completions API, extremely
// generous free tier (14,400 req/day on llama-3.1-8b-instant, 30 RPM).
// No credit card required. Model configurable via GROQ_MODEL in .env.
// ---------------------------------------------------------------------------
async function callGroqOnce(message: string, businessContext: any): Promise<AIResponse> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not set. Add it to your .env file.");
  }

  const modelName = process.env.GROQ_MODEL || "llama-3.1-8b-instant";
  const prompt = buildPrompt(message, businessContext);

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: modelName,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    const err: any = new Error(`Groq request failed: ${res.status} ${errText}`);
    err.status = res.status;
    throw err;
  }

  const data: any = await res.json();
  const text = data?.choices?.[0]?.message?.content || "";
  return safeParseAIResponse(text);
}

// ---------------------------------------------------------------------------
// DISPATCH
// ---------------------------------------------------------------------------
async function callProviderOnce(message: string, businessContext: any): Promise<AIResponse> {
  const provider = getActiveProvider();
  if (provider === "openrouter") return callOpenRouterOnce(message, businessContext);
  if (provider === "groq") return callGroqOnce(message, businessContext);
  return callGeminiOnce(message, businessContext);
}

// ---------------------------------------------------------------------------
// QUEUE + RETRY LAYER
// ---------------------------------------------------------------------------

interface QueueTask {
  message: string;
  businessContext: any;
  resolve: (value: AIResponse) => void;
  reject: (err: any) => void;
}

// Groq allows 30 RPM (1 every 2s) vs Gemini/OpenRouter free tiers being
// tighter — this gap is a safe default across all three. Lower it if you're
// only ever using Groq, since it can handle much faster pacing.
const MIN_GAP_MS = 15000;

let lastCallAt = 0;
let queue: QueueTask[] = [];
let draining = false;

function extractRetryDelayMs(err: any): number | null {
  try {
    const detail = err?.errorDetails?.find(
      (d: any) => d["@type"] === "type.googleapis.com/google.rpc.RetryInfo"
    );
    const raw = detail?.retryDelay;
    if (!raw) return null;
    const seconds = parseFloat(String(raw).replace("s", ""));
    return Number.isFinite(seconds) ? Math.ceil(seconds * 1000) : null;
  } catch {
    return null;
  }
}

async function callProviderWithRetry(
  message: string,
  businessContext: any,
  attempt = 0
): Promise<AIResponse> {
  try {
    return await callProviderOnce(message, businessContext);
  } catch (err: any) {
    const is429 = err?.status === 429;
    if (is429 && attempt < 2) {
      const suggested = extractRetryDelayMs(err);
      const delay = suggested ?? (attempt === 0 ? 15000 : 30000);
      console.warn(`⏳ [aiService/${getActiveProvider()}] Rate-limited. Retrying in ${Math.round(delay / 1000)}s (attempt ${attempt + 1}/2)...`);
      await sleep(delay);
      return callProviderWithRetry(message, businessContext, attempt + 1);
    }
    throw err;
  }
}

async function drainQueue() {
  if (draining) return;
  draining = true;

  while (queue.length > 0) {
    const task = queue.shift()!;
    const elapsed = Date.now() - lastCallAt;
    const wait = Math.max(0, MIN_GAP_MS - elapsed);
    if (wait > 0) await sleep(wait);

    try {
      const result = await callProviderWithRetry(task.message, task.businessContext);
      lastCallAt = Date.now();
      task.resolve(result);
    } catch (err) {
      lastCallAt = Date.now();
      task.reject(err);
    }
  }

  draining = false;
}

function enqueueProviderCall(message: string, businessContext: any): Promise<AIResponse> {
  return new Promise((resolve, reject) => {
    queue.push({ message, businessContext, resolve, reject });
    drainQueue();
  });
}

/**
 * Process a user message using dynamic multi-tenant business context.
 * Routes to Gemini, OpenRouter, or Groq based on AI_PROVIDER in .env.
 */
export async function processUserMessage(message: string, businessContext: any): Promise<AIResponse> {
  const fastAnswer = tryFastPathServicesAnswer(message, businessContext);
  if (fastAnswer) return fastAnswer;

  try {
    return await enqueueProviderCall(message, businessContext);
  } catch (err: any) {
    if (err?.status === 429) {
      return {
        intent: "unknown",
        reply: "We're getting a lot of messages right now! Please try again in about a minute. 🙏",
        missingFields: [],
      };
    }
    throw err;
  }
}