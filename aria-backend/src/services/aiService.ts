// /**
//  * FILENAME: src/services/aiService.ts
//  *
//  * ◄ UPDATED: added per-conversation memory + a confirm-before-booking step.
//  *
//  *   1. MEMORY — each caller now passes a stable `sessionId` (e.g.
//  *      `${businessId}:${chatId}`). We keep the last few turns of that
//  *      conversation in memory and feed them into the prompt, so "yes",
//  *      "make it 4pm instead", etc. resolve against what was actually said,
//  *      not just the current message in isolation.
//  *
//  *   2. CONFIRMATION — when the AI extracts a complete booking (service +
//  *      date + time, nothing missing), we do NOT return confirmed: true
//  *      immediately. We stash it as this session's `pendingBooking` and ask
//  *      the customer to confirm. Only when the NEXT message is a clear
//  *      "yes" do we return confirmed: true — and that check is a plain
//  *      regex, not another AI call, so it's instant and can't be talked
//  *      around. Callers (e.g. botManager.ts) must only write to the
//  *      database when `confirmed === true`.
//  */

// import { GoogleGenerativeAI } from "@google/generative-ai";
// import { AIResponse } from "../models/appointmentModel";

// // ---------------------------------------------------------------------------
// // PROVIDER SWITCH
// // Set AI_PROVIDER=gemini, openrouter, or groq in .env to switch.
// // Defaults to "gemini" if not set.
// // ---------------------------------------------------------------------------
// type AIProvider = "gemini" | "openrouter" | "groq";

// function getActiveProvider(): AIProvider {
//   const raw = (process.env.AI_PROVIDER || "gemini").toLowerCase();
//   if (raw === "openrouter") return "openrouter";
//   if (raw === "groq") return "groq";
//   return "gemini";
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
// // SESSION MEMORY
// // In-memory per-conversation state, keyed by sessionId (caller decides the
// // key — e.g. `${businessId}:${chatId}` for Telegram). This resets if the
// // server restarts; fine for a short booking conversation, not meant as
// // durable storage.
// // ---------------------------------------------------------------------------
// interface ConversationTurn {
//   role: "user" | "assistant";
//   text: string;
// }

// interface PendingBooking {
//   service: string;
//   date: string;
//   time: string;
// }

// interface Session {
//   history: ConversationTurn[];
//   pendingBooking?: PendingBooking;
//   lastActiveAt: number;
// }

// const MAX_HISTORY_TURNS = 6; // ~3 user + 3 assistant messages of context
// const SESSION_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours of inactivity = fresh start

// const sessions = new Map<string, Session>();

// function getSession(sessionId: string): Session {
//   const now = Date.now();
//   let session = sessions.get(sessionId);
//   if (!session || now - session.lastActiveAt > SESSION_TTL_MS) {
//     session = { history: [], lastActiveAt: now };
//     sessions.set(sessionId, session);
//   }
//   session.lastActiveAt = now;
//   return session;
// }

// function pushTurn(session: Session, role: ConversationTurn["role"], text: string): void {
//   session.history.push({ role, text });
//   if (session.history.length > MAX_HISTORY_TURNS) {
//     session.history.splice(0, session.history.length - MAX_HISTORY_TURNS);
//   }
// }

// // Deterministic yes/no detection for the confirmation step — no AI call,
// // so it's instant and can't be prompt-injected into saying something else.
// const AFFIRMATIVE_PATTERN = /^\s*(yes|yeah|yep|yup|sure|confirm(ed)?|correct|book\s*it|do\s*it|go\s*ahead|okay|ok|sounds good|please)\b/i;
// const NEGATIVE_PATTERN = /^\s*(no|nope|nah|cancel|never\s*mind|nevermind|wait|actually,?\s*no|stop)\b/i;

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
//  * ◄ UPDATED: now also injects recent conversation history so the model can
//  * resolve follow-ups like "make it 5 instead" or "the second one".
//  */
// function buildPrompt(message: string, businessContext: any, history: ConversationTurn[]): string {
//   const services = normalizeServices(businessContext);
//   const hours = normalizeHours(businessContext);

//   const servicesLine =
//     services.length > 0
//       ? `Services available at this shop: ${services.join(", ")}.`
//       : `No services have been configured for this shop yet.`;

//   const todayIso = new Date().toISOString().split("T")[0];

//   const historyBlock =
//     history.length > 0
//       ? `\nRecent conversation so far (oldest first — use this for context, e.g. resolving "yes", "that one", "make it later"):\n${history
//           .map((t) => `${t.role === "user" ? "Customer" : "Aria"}: ${t.text}`)
//           .join("\n")}\n`
//       : "";

//   const systemInstructions = `You are Aria, an AI appointment booking assistant for "${businessContext.name}".
// You operate a business of type: "${businessContext.businessType}".
// ${servicesLine}
// Our working hours are: ${hours.opens} to ${hours.closes}.
// Today's date is ${todayIso} (YYYY-MM-DD format).
// ${historyBlock}
// STRICT RULES — follow these exactly, do not improvise:
// 1. If the user asks what services/products are offered, you MUST set intent to "list_services" and your reply MUST list every item from the services array above, verbatim. NEVER say "I don't have a list of services" if the services array above is non-empty.
// 2. Only say services are unavailable if the services array above is genuinely empty.
// 3. When booking, only accept a service name that matches (or closely matches) one of the listed services. If the requested service is not in the list, tell the user it isn't offered and show them the actual list so they can pick a valid one.
// 4. Keep replies short, warm, and specific to "${businessContext.name}".
// 5. "date" MUST ALWAYS be output in strict ISO format "YYYY-MM-DD". Resolve any relative term ("today", "tomorrow", "next Monday", "in 3 days") into an actual date using today's date (${todayIso}) above. NEVER output a relative phrase like "tomorrow" directly in the "date" field.
// 6. "time" MUST ALWAYS be output in strict 24-hour "HH:MM" format (e.g. "15:00" for 3 PM, "09:30" for 9:30 AM). NEVER output "3 PM" or "12 PM" directly in the "time" field — convert it first.
// 7. Use the conversation history above to resolve follow-up messages (a bare "yes", a corrected time, "the haircut one") — don't treat every message as if it arrived with no context.

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
// // GEMINI PROVIDER
// // ---------------------------------------------------------------------------
// async function callGeminiOnce(message: string, businessContext: any, history: ConversationTurn[]): Promise<AIResponse> {
//   const ai = getGenAIClient();
//   const model = ai.getGenerativeModel({
//     model: "gemini-2.5-flash",
//     generationConfig: {
//       responseMimeType: "application/json",
//       temperature: 0.2,
//     },
//   });

//   const prompt = buildPrompt(message, businessContext, history);
//   const result = await model.generateContent(prompt);
//   const response = await result.response;
//   return safeParseAIResponse(response.text());
// }

// // ---------------------------------------------------------------------------
// // OPENROUTER PROVIDER — OpenAI-compatible chat completions API.
// // ---------------------------------------------------------------------------
// async function callOpenRouterOnce(message: string, businessContext: any, history: ConversationTurn[]): Promise<AIResponse> {
//   const apiKey = process.env.OPENROUTER_API_KEY;
//   if (!apiKey) {
//     throw new Error("OPENROUTER_API_KEY is not set. Add it to your .env file.");
//   }

//   const modelName = process.env.OPENROUTER_MODEL || "google/gemma-4-31b-it:free";
//   const prompt = buildPrompt(message, businessContext, history);

//   const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//       Authorization: `Bearer ${apiKey}`,
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
//     err.status = res.status;
//     throw err;
//   }

//   const data: any = await res.json();
//   const text = data?.choices?.[0]?.message?.content || "";
//   return safeParseAIResponse(text);
// }

// // ---------------------------------------------------------------------------
// // GROQ PROVIDER — OpenAI-compatible chat completions API, extremely
// // generous free tier (14,400 req/day on llama-3.1-8b-instant, 30 RPM).
// // No credit card required. Model configurable via GROQ_MODEL in .env.
// // ---------------------------------------------------------------------------
// async function callGroqOnce(message: string, businessContext: any, history: ConversationTurn[]): Promise<AIResponse> {
//   const apiKey = process.env.GROQ_API_KEY;
//   if (!apiKey) {
//     throw new Error("GROQ_API_KEY is not set. Add it to your .env file.");
//   }

//   const modelName = process.env.GROQ_MODEL || "llama-3.1-8b-instant";
//   const prompt = buildPrompt(message, businessContext, history);

//   const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//       Authorization: `Bearer ${apiKey}`,
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
//     const err: any = new Error(`Groq request failed: ${res.status} ${errText}`);
//     err.status = res.status;
//     throw err;
//   }

//   const data: any = await res.json();
//   const text = data?.choices?.[0]?.message?.content || "";
//   return safeParseAIResponse(text);
// }

// // ---------------------------------------------------------------------------
// // DISPATCH
// // ---------------------------------------------------------------------------
// async function callProviderOnce(message: string, businessContext: any, history: ConversationTurn[]): Promise<AIResponse> {
//   const provider = getActiveProvider();
//   if (provider === "openrouter") return callOpenRouterOnce(message, businessContext, history);
//   if (provider === "groq") return callGroqOnce(message, businessContext, history);
//   return callGeminiOnce(message, businessContext, history);
// }

// // ---------------------------------------------------------------------------
// // QUEUE + RETRY LAYER
// // ---------------------------------------------------------------------------

// interface QueueTask {
//   message: string;
//   businessContext: any;
//   history: ConversationTurn[];
//   resolve: (value: AIResponse) => void;
//   reject: (err: any) => void;
// }

// // Groq allows 30 RPM (1 every 2s) vs Gemini/OpenRouter free tiers being
// // tighter — this gap is a safe default across all three. Lower it if you're
// // only ever using Groq, since it can handle much faster pacing.
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

// async function callProviderWithRetry(
//   message: string,
//   businessContext: any,
//   history: ConversationTurn[],
//   attempt = 0
// ): Promise<AIResponse> {
//   try {
//     return await callProviderOnce(message, businessContext, history);
//   } catch (err: any) {
//     const is429 = err?.status === 429;
//     if (is429 && attempt < 2) {
//       const suggested = extractRetryDelayMs(err);
//       const delay = suggested ?? (attempt === 0 ? 15000 : 30000);
//       console.warn(`⏳ [aiService/${getActiveProvider()}] Rate-limited. Retrying in ${Math.round(delay / 1000)}s (attempt ${attempt + 1}/2)...`);
//       await sleep(delay);
//       return callProviderWithRetry(message, businessContext, history, attempt + 1);
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
//       const result = await callProviderWithRetry(task.message, task.businessContext, task.history);
//       lastCallAt = Date.now();
//       task.resolve(result);
//     } catch (err) {
//       lastCallAt = Date.now();
//       task.reject(err);
//     }
//   }

//   draining = false;
// }

// function enqueueProviderCall(message: string, businessContext: any, history: ConversationTurn[]): Promise<AIResponse> {
//   return new Promise((resolve, reject) => {
//     queue.push({ message, businessContext, history, resolve, reject });
//     drainQueue();
//   });
// }

// /**
//  * Process a user message using dynamic multi-tenant business context.
//  * Routes to Gemini, OpenRouter, or Groq based on AI_PROVIDER in .env.
//  *
//  * ◄ UPDATED SIGNATURE: now takes `sessionId` first — a stable key identifying
//  * this specific conversation (e.g. `${businessId}:${chatId}` for Telegram).
//  * Used to keep short-term memory and the confirm-before-booking state.
//  *
//  * IMPORTANT for callers: only treat a booking as real when the returned
//  * `confirmed` field is `true`. `intent === "book"` alone now just means
//  * "the AI understood what you want" — it does NOT mean "go write this to
//  * the database."
//  */
// export async function processUserMessage(
//   sessionId: string,
//   message: string,
//   businessContext: any
// ): Promise<AIResponse> {
//   const session = getSession(sessionId);
//   const trimmed = message.trim();

//   // -------------------------------------------------------------------
//   // 1. If we're waiting on a yes/no for a previously-proposed booking,
//   //    resolve that FIRST — deterministically, no AI call. This is what
//   //    actually gates database writes on the caller's side.
//   // -------------------------------------------------------------------
//   if (session.pendingBooking) {
//     if (AFFIRMATIVE_PATTERN.test(trimmed)) {
//       const { service, date, time } = session.pendingBooking;
//       session.pendingBooking = undefined;
//       pushTurn(session, "user", message);
//       const reply = `Great, you're all set! Booked *${service}* on ${date} at ${time}. See you then! 🎉`;
//       pushTurn(session, "assistant", reply);
//       return { intent: "book", service, date, time, confirmed: true, missingFields: [], reply };
//     }

//     if (NEGATIVE_PATTERN.test(trimmed)) {
//       session.pendingBooking = undefined;
//       pushTurn(session, "user", message);
//       const reply = `No problem, I won't book that. What would you like to do instead?`;
//       pushTurn(session, "assistant", reply);
//       return { intent: "unknown", confirmed: false, missingFields: [], reply };
//     }

//     // Anything else: the customer moved on without a clear yes/no. Drop the
//     // stale pending booking rather than keep re-asking about it forever,
//     // and fall through to normal processing below.
//     session.pendingBooking = undefined;
//   }

//   // -------------------------------------------------------------------
//   // 2. Fast path — no AI call, still counts as a real conversation turn.
//   // -------------------------------------------------------------------
//   const fastAnswer = tryFastPathServicesAnswer(trimmed, businessContext);
//   if (fastAnswer) {
//     pushTurn(session, "user", message);
//     pushTurn(session, "assistant", fastAnswer.reply);
//     return fastAnswer;
//   }

//   // -------------------------------------------------------------------
//   // 3. Full AI call, with recent history so follow-ups make sense.
//   // -------------------------------------------------------------------
//   let aiResponse: AIResponse;
//   try {
//     aiResponse = await enqueueProviderCall(trimmed, businessContext, session.history);
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

//   pushTurn(session, "user", message);

//   // -------------------------------------------------------------------
//   // 4. If the AI extracted a COMPLETE booking, don't hand it back as
//   //    ready-to-save. Hold it as pending and ask the customer to confirm.
//   // -------------------------------------------------------------------
//   const missing = aiResponse.missingFields || [];
//   if (
//     aiResponse.intent === "book" &&
//     missing.length === 0 &&
//     aiResponse.service &&
//     aiResponse.date &&
//     aiResponse.time
//   ) {
//     session.pendingBooking = {
//       service: aiResponse.service,
//       date: aiResponse.date,
//       time: aiResponse.time,
//     };
//     aiResponse = {
//       ...aiResponse,
//       confirmed: false,
//       reply: `Just to confirm — *${aiResponse.service}* on ${aiResponse.date} at ${aiResponse.time}. Shall I book it? (yes/no)`,
//     };
//   }

//   pushTurn(session, "assistant", aiResponse.reply);
//   return aiResponse;
// }

/**
 * FILENAME: src/services/aiService.ts
 *
 * ◄ REWRITTEN: booking state is now a real object the SERVER owns
 * (`session.draft`), not something the LLM has to reconstruct from a wall
 * of chat history text every turn. This fixes the class of bugs where a
 * free-tier model "forgets" a slot it was already given and re-asks the
 * same question, or fumbles a bare answer like "Zumba classes".
 *
 * Rules of the new flow:
 *   1. If exactly one slot (service / date / time) is missing, try to
 *      resolve it LOCALLY first — fuzzy-match against the services list,
 *      or parse the date/time with plain regex. No AI call, no chance of
 *      the model mangling a simple answer. Falls back to a full AI parse
 *      only if local parsing can't make sense of the message.
 *   2. The AI is only ever asked to fill in whatever it can find in the
 *      CURRENT message. The code merges that into session.draft and never
 *      lets a "null" from the AI erase a slot we already had.
 *   3. Confirmation (yes/no) is resolved locally first, tolerant of typos
 *      ("Yed" ≈ "yes"), and only escalates to a one-word AI classification
 *      call if local matching is genuinely ambiguous.
 *   4. date/time returned by the AI are validated against strict formats
 *      before being trusted — garbage like "blah o'clock" is discarded,
 *      not passed through.
 *
 * Public signature is UNCHANGED — processUserMessage(sessionId, message,
 * businessContext) → AIResponse — so botManager.ts needs no edits.
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import { AIResponse } from "../models/appointmentModel";

// ---------------------------------------------------------------------------
// PROVIDER SWITCH
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
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set. Add it to your .env file.");
  return new GoogleGenerativeAI(apiKey);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeServices(businessContext: any): string[] {
  const raw =
    businessContext?.servicesProvided ??
    businessContext?.services ??
    businessContext?.serviceList ??
    businessContext?.inventory ??
    [];
  if (Array.isArray(raw)) return raw.map((s) => String(s).trim()).filter(Boolean);
  if (typeof raw === "string") return raw.split(",").map((s) => s.trim()).filter(Boolean);
  return [];
}

function normalizeHours(businessContext: any): { opens: string; closes: string } {
  const opens = businessContext?.hours?.opens ?? businessContext?.openingHours ?? "10:00 AM";
  const closes = businessContext?.hours?.closes ?? businessContext?.closingHours ?? "8:00 PM";
  return { opens, closes };
}

// ---------------------------------------------------------------------------
// FUZZY MATCHING — used for both "which service did they mean" and
// tolerant yes/no detection ("Yed" → "yes").
// ---------------------------------------------------------------------------
function levenshtein(a: string, b: string): number {
  a = a.toLowerCase();
  b = b.toLowerCase();
  const dp: number[][] = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) dp[i][0] = i;
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[a.length][b.length];
}

const FILLER_WORDS = /\bclasses?\b|\bsession\b|\btraining\b|\bpackage\b|\bprogram\b|\bplan\b|\bvisit\b/gi;

/** Fuzzy-match a raw customer message against the shop's service list. */
function fuzzyMatchService(input: string, services: string[]): string | null {
  const raw = input.trim().toLowerCase();
  if (!raw) return null;
  const stripped = raw.replace(FILLER_WORDS, "").trim();

  const exact = services.find((s) => s.toLowerCase() === raw);
  if (exact) return exact;

  const substr = services.find((s) => {
    const sl = s.toLowerCase();
    const slStripped = sl.replace(FILLER_WORDS, "").trim();
    return sl.includes(raw) || raw.includes(sl) || (stripped && (sl.includes(stripped) || slStripped === stripped));
  });
  if (substr) return substr;

  let best: { s: string; dist: number } | null = null;
  for (const s of services) {
    const dist = levenshtein(raw, s.toLowerCase());
    const tolerance = Math.max(2, Math.floor(s.length * 0.3));
    if (dist <= tolerance && (!best || dist < best.dist)) best = { s, dist };
  }
  return best?.s ?? null;
}

const AFFIRMATIVE_WORDS = ["yes", "yeah", "yep", "yup", "sure", "confirm", "confirmed", "correct", "ok", "okay", "please"];
const NEGATIVE_WORDS = ["no", "nope", "nah", "cancel", "nevermind", "wait", "stop"];

function classifyYesNoLocal(text: string): "yes" | "no" | "unclear" {
  const t = text.trim().toLowerCase();
  if (/^\s*(book\s*it|do\s*it|go\s*ahead|sounds good)\b/.test(t)) return "yes";
  if (/^\s*(actually,?\s*no)\b/.test(t)) return "no";
  const firstWord = (t.split(/\s+/)[0] || "").replace(/[^a-z]/g, "");
  if (!firstWord) return "unclear";
  for (const w of AFFIRMATIVE_WORDS) {
    if (firstWord === w || (firstWord.length >= 2 && levenshtein(firstWord, w) <= 1)) return "yes";
  }
  for (const w of NEGATIVE_WORDS) {
    if (firstWord === w || (firstWord.length >= 2 && levenshtein(firstWord, w) <= 1)) return "no";
  }
  return "unclear";
}

// ---------------------------------------------------------------------------
// LOCAL SLOT PARSERS — resolve simple, single-field answers instantly,
// without an AI call. This is what fixes "Zumba classes" not being
// recognised as an answer to "what service would you like?".
// ---------------------------------------------------------------------------
function parseTimeLocal(text: string): string | null {
  const t = text.trim().toLowerCase();
  if (/\bnoon\b/.test(t)) return "12:00";
  if (/\bmidnight\b/.test(t)) return "00:00";

  const m24 = t.match(/\b([01]?\d|2[0-3]):([0-5]\d)\b/);
  if (m24 && !/am|pm/.test(t)) return `${m24[1].padStart(2, "0")}:${m24[2]}`;

  const m12 = t.match(/\b(1[0-2]|0?[1-9])(?::([0-5]\d))?\s*(am|pm|a\.m\.|p\.m\.)\b/);
  if (m12) {
    let hh = parseInt(m12[1], 10);
    const mm = m12[2] ?? "00";
    const isPm = m12[3].startsWith("p");
    if (isPm && hh !== 12) hh += 12;
    if (!isPm && hh === 12) hh = 0;
    return `${String(hh).padStart(2, "0")}:${mm}`;
  }
  return null;
}

function parseDateLocal(text: string, todayIso: string): string | null {
  const t = text.trim().toLowerCase();
  const today = new Date(todayIso + "T00:00:00");

  const iso = t.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
  if (iso) return iso[0];
  if (/\btoday\b/.test(t)) return todayIso;

  if (/\bday after tomorrow\b/.test(t)) {
    const d = new Date(today);
    d.setDate(d.getDate() + 2);
    return d.toISOString().split("T")[0];
  }
  if (/\btomorrow\b/.test(t)) {
    const d = new Date(today);
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  }
  const inN = t.match(/\bin (\d+) days?\b/);
  if (inN) {
    const d = new Date(today);
    d.setDate(d.getDate() + parseInt(inN[1], 10));
    return d.toISOString().split("T")[0];
  }
  const weekdays = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const wd = weekdays.findIndex((w) => t.includes(w));
  if (wd !== -1) {
    const d = new Date(today);
    let diff = (wd - d.getDay() + 7) % 7;
    if (diff === 0 || /\bnext\b/.test(t)) diff += 7;
    d.setDate(d.getDate() + diff);
    return d.toISOString().split("T")[0];
  }
  return null;
}

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const HHMM_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

// ---------------------------------------------------------------------------
// SESSION STATE — the source of truth for what's known about this booking.
// The LLM is never trusted to "remember" this on its own.
// ---------------------------------------------------------------------------
interface ConversationTurn {
  role: "user" | "assistant";
  text: string;
}

interface Draft {
  service?: string;
  date?: string;
  time?: string;
}

interface Session {
  history: ConversationTurn[];
  draft: Draft;
  awaitingConfirmation: boolean;
  lastActiveAt: number;
}

const MAX_HISTORY_TURNS = 6;
const SESSION_TTL_MS = 2 * 60 * 60 * 1000;
const sessions = new Map<string, Session>();

function getSession(sessionId: string): Session {
  const now = Date.now();
  let session = sessions.get(sessionId);
  if (!session || now - session.lastActiveAt > SESSION_TTL_MS) {
    session = { history: [], draft: {}, awaitingConfirmation: false, lastActiveAt: now };
    sessions.set(sessionId, session);
  }
  session.lastActiveAt = now;
  return session;
}

function pushTurn(session: Session, role: ConversationTurn["role"], text: string): void {
  session.history.push({ role, text });
  if (session.history.length > MAX_HISTORY_TURNS) {
    session.history.splice(0, session.history.length - MAX_HISTORY_TURNS);
  }
}

function missingFieldsOf(draft: Draft): string[] {
  const missing: string[] = [];
  if (!draft.service) missing.push("service");
  if (!draft.date) missing.push("date");
  if (!draft.time) missing.push("time");
  return missing;
}

function askForMissingReply(shopName: string, draft: Draft, missing: string[], hours: { opens: string; closes: string }): string {
  if (missing.includes("service")) return `Sure! What service would you like to book at ${shopName}?`;
  if (missing.includes("date") && missing.includes("time")) {
    return `Great choice — *${draft.service}*. What date and time works for you? Our hours are ${hours.opens} to ${hours.closes}.`;
  }
  if (missing.includes("date")) return `Got it — *${draft.service}* at ${draft.time}. What date works for you?`;
  if (missing.includes("time")) {
    return `Got it — *${draft.service}* on ${draft.date}. What time works for you? Our hours are ${hours.opens} to ${hours.closes}.`;
  }
  return `Could you tell me a bit more about what you'd like to book?`;
}

// ---------------------------------------------------------------------------
// FAST PATH: "what services do you offer" — no AI call.
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

// ---------------------------------------------------------------------------
// AI EXTRACTION PROMPT — only ever describes the CURRENT message plus what
// we already know. The model is explicitly told not to guess or null out
// fields it isn't sure about; the merge step (below) never lets a fresh
// null overwrite a slot we already had.
// ---------------------------------------------------------------------------
function buildExtractionPrompt(message: string, businessContext: any, draft: Draft): string {
  const services = normalizeServices(businessContext);
  const hours = normalizeHours(businessContext);
  const todayIso = new Date().toISOString().split("T")[0];

  const servicesLine =
    services.length > 0
      ? `Services available at this shop: ${services.join(", ")}.`
      : `No services have been configured for this shop yet.`;

  const knownLine = `Already known so far — service: ${draft.service ?? "(none yet)"}, date: ${draft.date ?? "(none yet)"}, time: ${draft.time ?? "(none yet)"}.`;

  return `You are Aria, an AI appointment booking assistant for "${businessContext.name}" (${businessContext.businessType}).
${servicesLine}
Working hours: ${hours.opens} to ${hours.closes}.
Today's date is ${todayIso} (YYYY-MM-DD).
${knownLine}

STRICT RULES:
1. Only extract a field if the customer's LATEST message actually specifies it. If a field isn't mentioned in this message, return null for it — do NOT repeat, guess, or invent a value, even if one is already known above.
2. Only accept a service that matches (or closely matches) one of the listed services.
3. "date" must be strict ISO "YYYY-MM-DD", resolved from today's date (${todayIso}) if relative ("tomorrow", "next Monday", etc). Never output a relative phrase directly.
4. "time" must be strict 24-hour "HH:MM". Never output "3 PM" directly — convert it.
5. If the message is about cancelling, viewing, or rescheduling an existing appointment, set intent accordingly instead of "book".

From the customer's message, extract:
- intent: "book" | "view" | "cancel" | "reschedule" | "list_services" | "unknown"
- service, date, time: only if mentioned in THIS message (else null)
- reply: a short, friendly reply

Respond ONLY with strict JSON, no markdown fences:
{"intent": string, "service": string|null, "date": string|null, "time": string|null, "reply": string}

Customer message: "${message}"
JSON response:`;
}

function safeParseExtraction(raw: string): { intent: string; service: string | null; date: string | null; time: string | null; reply: string } {
  try {
    const cleaned = raw.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);
    return {
      intent: parsed.intent ?? "unknown",
      service: parsed.service || null,
      date: parsed.date || null,
      time: parsed.time || null,
      reply: parsed.reply ?? "Sorry, I didn't quite catch that. Could you rephrase?",
    };
  } catch {
    return { intent: "unknown", service: null, date: null, time: null, reply: "Sorry, I had trouble understanding that. Could you rephrase your request?" };
  }
}

// ---------------------------------------------------------------------------
// RAW PROVIDER CALLS — one generic "send this prompt, get text back" per
// provider. Used both for full extraction and for the yes/no fallback.
// ---------------------------------------------------------------------------
async function callGeminiRaw(prompt: string): Promise<string> {
  const ai = getGenAIClient();
  const model = ai.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: { responseMimeType: "application/json", temperature: 0.2 },
  });
  const result = await model.generateContent(prompt);
  return (await result.response).text();
}

async function callOpenRouterRaw(prompt: string): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY is not set. Add it to your .env file.");
  const modelName = process.env.OPENROUTER_MODEL || "google/gemma-4-31b-it:free";
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}`, "HTTP-Referer": "http://localhost:5000", "X-Title": "Aria SaaS Backend" },
    body: JSON.stringify({ model: modelName, messages: [{ role: "user", content: prompt }], temperature: 0.2, response_format: { type: "json_object" } }),
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    const err: any = new Error(`OpenRouter request failed: ${res.status} ${errText}`);
    err.status = res.status;
    throw err;
  }
  const data: any = await res.json();
  return data?.choices?.[0]?.message?.content || "";
}

async function callGroqRaw(prompt: string): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY is not set. Add it to your .env file.");
  const modelName = process.env.GROQ_MODEL || "llama-3.1-8b-instant";
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model: modelName, messages: [{ role: "user", content: prompt }], temperature: 0.2, response_format: { type: "json_object" } }),
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    const err: any = new Error(`Groq request failed: ${res.status} ${errText}`);
    err.status = res.status;
    throw err;
  }
  const data: any = await res.json();
  return data?.choices?.[0]?.message?.content || "";
}

async function callProviderRawOnce(prompt: string): Promise<string> {
  const provider = getActiveProvider();
  if (provider === "openrouter") return callOpenRouterRaw(prompt);
  if (provider === "groq") return callGroqRaw(prompt);
  return callGeminiRaw(prompt);
}

// ---------------------------------------------------------------------------
// QUEUE + RETRY LAYER (unchanged in spirit — paces calls, retries 429s)
// ---------------------------------------------------------------------------
interface QueueTask {
  prompt: string;
  resolve: (value: string) => void;
  reject: (err: any) => void;
}

const MIN_GAP_MS = 15000;
let lastCallAt = 0;
let queue: QueueTask[] = [];
let draining = false;

function extractRetryDelayMs(err: any): number | null {
  try {
    const detail = err?.errorDetails?.find((d: any) => d["@type"] === "type.googleapis.com/google.rpc.RetryInfo");
    const raw = detail?.retryDelay;
    if (!raw) return null;
    const seconds = parseFloat(String(raw).replace("s", ""));
    return Number.isFinite(seconds) ? Math.ceil(seconds * 1000) : null;
  } catch {
    return null;
  }
}

async function callProviderRawWithRetry(prompt: string, attempt = 0): Promise<string> {
  try {
    return await callProviderRawOnce(prompt);
  } catch (err: any) {
    const is429 = err?.status === 429;
    if (is429 && attempt < 2) {
      const suggested = extractRetryDelayMs(err);
      const delay = suggested ?? (attempt === 0 ? 15000 : 30000);
      console.warn(`⏳ [aiService/${getActiveProvider()}] Rate-limited. Retrying in ${Math.round(delay / 1000)}s...`);
      await sleep(delay);
      return callProviderRawWithRetry(prompt, attempt + 1);
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
      const result = await callProviderRawWithRetry(task.prompt);
      lastCallAt = Date.now();
      task.resolve(result);
    } catch (err) {
      lastCallAt = Date.now();
      task.reject(err);
    }
  }
  draining = false;
}

function enqueuePrompt(prompt: string): Promise<string> {
  return new Promise((resolve, reject) => {
    queue.push({ prompt, resolve, reject });
    drainQueue();
  });
}

// ---------------------------------------------------------------------------
// YES/NO FALLBACK — only hit when local matching is genuinely ambiguous
// (e.g. "make it 4pm instead" during the confirm step). Cheap, single-word
// classification, not a full re-extraction.
// ---------------------------------------------------------------------------
async function classifyYesNoWithAI(text: string): Promise<"yes" | "no" | "other"> {
  const prompt = `Reply with exactly one word: YES if the message means "confirm/proceed", NO if it means "cancel/decline", OTHER for anything else (like a correction). Message: "${text}"`;
  try {
    const raw = await enqueuePrompt(prompt);
    const word = raw.trim().toLowerCase();
    if (word.startsWith("yes")) return "yes";
    if (word.startsWith("no")) return "no";
    return "other";
  } catch {
    return "other";
  }
}

/**
 * Process a user message using dynamic multi-tenant business context.
 * `sessionId` should be stable per conversation (e.g. `${businessId}:${chatId}`).
 *
 * Callers must only write to the database when `confirmed === true`.
 */
export async function processUserMessage(sessionId: string, message: string, businessContext: any): Promise<AIResponse> {
  const session = getSession(sessionId);
  const trimmed = message.trim();
  const services = normalizeServices(businessContext);
  const hours = normalizeHours(businessContext);
  const shopName = businessContext?.name || "us";

  // -----------------------------------------------------------------------
  // 1. CONFIRMATION STEP
  // -----------------------------------------------------------------------
  if (session.awaitingConfirmation) {
    let verdict = classifyYesNoLocal(trimmed);
    if (verdict === "unclear") verdict = (await classifyYesNoWithAI(trimmed)) as any;

    if (verdict === "yes") {
      const { service, date, time } = session.draft;
      session.draft = {};
      session.awaitingConfirmation = false;
      pushTurn(session, "user", message);
      const reply = `Great, you're all set! Booked *${service}* on ${date} at ${time}. See you then! 🎉`;
      pushTurn(session, "assistant", reply);
      return { intent: "book", service, date, time, confirmed: true, missingFields: [], reply };
    }

    if (verdict === "no") {
      session.draft = {};
      session.awaitingConfirmation = false;
      pushTurn(session, "user", message);
      const reply = `No problem, I won't book that. What would you like to do instead?`;
      pushTurn(session, "assistant", reply);
      return { intent: "unknown", confirmed: false, missingFields: [], reply };
    }

    // "other" — e.g. "actually can we do 4pm instead". Don't discard the
    // draft; treat it as an edit and fall through to normal extraction,
    // then re-confirm below.
    session.awaitingConfirmation = false;
  }

  // -----------------------------------------------------------------------
  // 2. FAST PATH — services list, no AI call.
  // -----------------------------------------------------------------------
  const fastAnswer = tryFastPathServicesAnswer(trimmed, businessContext);
  if (fastAnswer) {
    pushTurn(session, "user", message);
    pushTurn(session, "assistant", fastAnswer.reply);
    return fastAnswer;
  }

  // -----------------------------------------------------------------------
  // 3. SINGLE-SLOT LOCAL RESOLUTION — if we're mid-booking and only one
  // field is missing, try to resolve it directly from the raw message
  // before ever calling the AI. This is what fixes "Zumba classes" not
  // being recognised as an answer, and garbled slot re-asks.
  // -----------------------------------------------------------------------
  const missingBefore = missingFieldsOf(session.draft);
  const isMidBooking = missingBefore.length > 0 && missingBefore.length < 3;

  if (isMidBooking && missingBefore.length === 1) {
    const field = missingBefore[0];
    let resolvedLocally = false;

    if (field === "service") {
      const match = fuzzyMatchService(trimmed, services);
      if (match) {
        session.draft.service = match;
        resolvedLocally = true;
      }
    } else if (field === "date") {
      const todayIso = new Date().toISOString().split("T")[0];
      const parsed = parseDateLocal(trimmed, todayIso);
      if (parsed) {
        session.draft.date = parsed;
        resolvedLocally = true;
      }
    } else if (field === "time") {
      const parsed = parseTimeLocal(trimmed);
      if (parsed) {
        session.draft.time = parsed;
        resolvedLocally = true;
      }
    }

    if (resolvedLocally) {
      pushTurn(session, "user", message);
      const stillMissing = missingFieldsOf(session.draft);

      if (stillMissing.length === 0) {
        session.awaitingConfirmation = true;
        const reply = `Just to confirm — *${session.draft.service}* on ${session.draft.date} at ${session.draft.time}. Shall I book it? (yes/no)`;
        pushTurn(session, "assistant", reply);
        return { intent: "book", ...session.draft, confirmed: false, missingFields: [], reply };
      }

      const reply = askForMissingReply(shopName, session.draft, stillMissing, hours);
      pushTurn(session, "assistant", reply);
      return { intent: "book", ...session.draft, confirmed: false, missingFields: stillMissing, reply };
    }

    // If it's the "service" slot and local fuzzy match failed outright,
    // don't burn an AI call on a message that's clearly not a valid
    // service name — just show the list again.
    if (field === "service") {
      pushTurn(session, "user", message);
      const reply = `Sorry, we don't offer that at ${shopName}. We have: ${services.join(", ")}. Which one would you like to book?`;
      pushTurn(session, "assistant", reply);
      return { intent: "book", ...session.draft, confirmed: false, missingFields: missingBefore, reply };
    }
  }

  // -----------------------------------------------------------------------
  // 4. FULL AI EXTRACTION — fresh booking, multi-field message, or a
  // single-slot answer that local parsing couldn't make sense of.
  // -----------------------------------------------------------------------
  let extracted;
  try {
    const prompt = buildExtractionPrompt(trimmed, businessContext, session.draft);
    const raw = await enqueuePrompt(prompt);
    extracted = safeParseExtraction(raw);
  } catch (err: any) {
    if (err?.status === 429) {
      return { intent: "unknown", reply: "We're getting a lot of messages right now! Please try again in about a minute. 🙏", missingFields: [] };
    }
    throw err;
  }

  pushTurn(session, "user", message);

  if (extracted.intent === "view" || extracted.intent === "cancel" || extracted.intent === "reschedule") {
    pushTurn(session, "assistant", extracted.reply);
    return { intent: extracted.intent as any, missingFields: [], reply: extracted.reply };
  }

  // Merge — never let a null from the AI erase a slot we already had.
  if (extracted.service) {
    const match = fuzzyMatchService(extracted.service, services) || extracted.service;
    session.draft.service = match;
  }
  if (extracted.date && ISO_DATE_RE.test(extracted.date)) session.draft.date = extracted.date;
  if (extracted.time && HHMM_RE.test(extracted.time)) session.draft.time = extracted.time;

  const missing = missingFieldsOf(session.draft);

  if (missing.length === 0) {
    session.awaitingConfirmation = true;
    const reply = `Just to confirm — *${session.draft.service}* on ${session.draft.date} at ${session.draft.time}. Shall I book it? (yes/no)`;
    pushTurn(session, "assistant", reply);
    return { intent: "book", ...session.draft, confirmed: false, missingFields: [], reply };
  }

  const reply = askForMissingReply(shopName, session.draft, missing, hours);
  pushTurn(session, "assistant", reply);
  return { intent: "book", ...session.draft, confirmed: false, missingFields: missing, reply };
}