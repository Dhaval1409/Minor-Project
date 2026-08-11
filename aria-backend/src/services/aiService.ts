/**
 * FILENAME: src/services/aiService.ts
 *
 * ◄ UPDATED: added per-conversation memory + a confirm-before-booking step.
 *
 *   1. MEMORY — each caller now passes a stable `sessionId` (e.g.
 *      `${businessId}:${chatId}`). We keep the last few turns of that
 *      conversation in memory and feed them into the prompt, so "yes",
 *      "make it 4pm instead", etc. resolve against what was actually said,
 *      not just the current message in isolation.
 *
 *   2. CONFIRMATION — when the AI extracts a complete booking (service +
 *      date + time, nothing missing), we do NOT return confirmed: true
 *      immediately. We stash it as this session's `pendingBooking` and ask
 *      the customer to confirm. Only when the NEXT message is a clear
 *      "yes" do we return confirmed: true — and that check is a plain
 *      regex, not another AI call, so it's instant and can't be talked
 *      around. Callers (e.g. botManager.ts) must only write to the
 *      database when `confirmed === true`.
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
// SESSION MEMORY
// In-memory per-conversation state, keyed by sessionId (caller decides the
// key — e.g. `${businessId}:${chatId}` for Telegram). This resets if the
// server restarts; fine for a short booking conversation, not meant as
// durable storage.
// ---------------------------------------------------------------------------
interface ConversationTurn {
  role: "user" | "assistant";
  text: string;
}

interface PendingBooking {
  service: string;
  date: string;
  time: string;
}

interface Session {
  history: ConversationTurn[];
  pendingBooking?: PendingBooking;
  lastActiveAt: number;
}

const MAX_HISTORY_TURNS = 6; // ~3 user + 3 assistant messages of context
const SESSION_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours of inactivity = fresh start

const sessions = new Map<string, Session>();

function getSession(sessionId: string): Session {
  const now = Date.now();
  let session = sessions.get(sessionId);
  if (!session || now - session.lastActiveAt > SESSION_TTL_MS) {
    session = { history: [], lastActiveAt: now };
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

// Deterministic yes/no detection for the confirmation step — no AI call,
// so it's instant and can't be prompt-injected into saying something else.
const AFFIRMATIVE_PATTERN = /^\s*(yes|yeah|yep|yup|sure|confirm(ed)?|correct|book\s*it|do\s*it|go\s*ahead|okay|ok|sounds good|please)\b/i;
const NEGATIVE_PATTERN = /^\s*(no|nope|nah|cancel|never\s*mind|nevermind|wait|actually,?\s*no|stop)\b/i;

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
 * ◄ UPDATED: now also injects recent conversation history so the model can
 * resolve follow-ups like "make it 5 instead" or "the second one".
 */
function buildPrompt(message: string, businessContext: any, history: ConversationTurn[]): string {
  const services = normalizeServices(businessContext);
  const hours = normalizeHours(businessContext);

  const servicesLine =
    services.length > 0
      ? `Services available at this shop: ${services.join(", ")}.`
      : `No services have been configured for this shop yet.`;

  const todayIso = new Date().toISOString().split("T")[0];

  const historyBlock =
    history.length > 0
      ? `\nRecent conversation so far (oldest first — use this for context, e.g. resolving "yes", "that one", "make it later"):\n${history
          .map((t) => `${t.role === "user" ? "Customer" : "Aria"}: ${t.text}`)
          .join("\n")}\n`
      : "";

  const systemInstructions = `You are Aria, an AI appointment booking assistant for "${businessContext.name}".
You operate a business of type: "${businessContext.businessType}".
${servicesLine}
Our working hours are: ${hours.opens} to ${hours.closes}.
Today's date is ${todayIso} (YYYY-MM-DD format).
${historyBlock}
STRICT RULES — follow these exactly, do not improvise:
1. If the user asks what services/products are offered, you MUST set intent to "list_services" and your reply MUST list every item from the services array above, verbatim. NEVER say "I don't have a list of services" if the services array above is non-empty.
2. Only say services are unavailable if the services array above is genuinely empty.
3. When booking, only accept a service name that matches (or closely matches) one of the listed services. If the requested service is not in the list, tell the user it isn't offered and show them the actual list so they can pick a valid one.
4. Keep replies short, warm, and specific to "${businessContext.name}".
5. "date" MUST ALWAYS be output in strict ISO format "YYYY-MM-DD". Resolve any relative term ("today", "tomorrow", "next Monday", "in 3 days") into an actual date using today's date (${todayIso}) above. NEVER output a relative phrase like "tomorrow" directly in the "date" field.
6. "time" MUST ALWAYS be output in strict 24-hour "HH:MM" format (e.g. "15:00" for 3 PM, "09:30" for 9:30 AM). NEVER output "3 PM" or "12 PM" directly in the "time" field — convert it first.
7. Use the conversation history above to resolve follow-up messages (a bare "yes", a corrected time, "the haircut one") — don't treat every message as if it arrived with no context.

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
async function callGeminiOnce(message: string, businessContext: any, history: ConversationTurn[]): Promise<AIResponse> {
  const ai = getGenAIClient();
  const model = ai.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.2,
    },
  });

  const prompt = buildPrompt(message, businessContext, history);
  const result = await model.generateContent(prompt);
  const response = await result.response;
  return safeParseAIResponse(response.text());
}

// ---------------------------------------------------------------------------
// OPENROUTER PROVIDER — OpenAI-compatible chat completions API.
// ---------------------------------------------------------------------------
async function callOpenRouterOnce(message: string, businessContext: any, history: ConversationTurn[]): Promise<AIResponse> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not set. Add it to your .env file.");
  }

  const modelName = process.env.OPENROUTER_MODEL || "google/gemma-4-31b-it:free";
  const prompt = buildPrompt(message, businessContext, history);

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
// GROQ PROVIDER — OpenAI-compatible chat completions API, extremely
// generous free tier (14,400 req/day on llama-3.1-8b-instant, 30 RPM).
// No credit card required. Model configurable via GROQ_MODEL in .env.
// ---------------------------------------------------------------------------
async function callGroqOnce(message: string, businessContext: any, history: ConversationTurn[]): Promise<AIResponse> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not set. Add it to your .env file.");
  }

  const modelName = process.env.GROQ_MODEL || "llama-3.1-8b-instant";
  const prompt = buildPrompt(message, businessContext, history);

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
async function callProviderOnce(message: string, businessContext: any, history: ConversationTurn[]): Promise<AIResponse> {
  const provider = getActiveProvider();
  if (provider === "openrouter") return callOpenRouterOnce(message, businessContext, history);
  if (provider === "groq") return callGroqOnce(message, businessContext, history);
  return callGeminiOnce(message, businessContext, history);
}

// ---------------------------------------------------------------------------
// QUEUE + RETRY LAYER
// ---------------------------------------------------------------------------

interface QueueTask {
  message: string;
  businessContext: any;
  history: ConversationTurn[];
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
  history: ConversationTurn[],
  attempt = 0
): Promise<AIResponse> {
  try {
    return await callProviderOnce(message, businessContext, history);
  } catch (err: any) {
    const is429 = err?.status === 429;
    if (is429 && attempt < 2) {
      const suggested = extractRetryDelayMs(err);
      const delay = suggested ?? (attempt === 0 ? 15000 : 30000);
      console.warn(`⏳ [aiService/${getActiveProvider()}] Rate-limited. Retrying in ${Math.round(delay / 1000)}s (attempt ${attempt + 1}/2)...`);
      await sleep(delay);
      return callProviderWithRetry(message, businessContext, history, attempt + 1);
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
      const result = await callProviderWithRetry(task.message, task.businessContext, task.history);
      lastCallAt = Date.now();
      task.resolve(result);
    } catch (err) {
      lastCallAt = Date.now();
      task.reject(err);
    }
  }

  draining = false;
}

function enqueueProviderCall(message: string, businessContext: any, history: ConversationTurn[]): Promise<AIResponse> {
  return new Promise((resolve, reject) => {
    queue.push({ message, businessContext, history, resolve, reject });
    drainQueue();
  });
}

/**
 * Process a user message using dynamic multi-tenant business context.
 * Routes to Gemini, OpenRouter, or Groq based on AI_PROVIDER in .env.
 *
 * ◄ UPDATED SIGNATURE: now takes `sessionId` first — a stable key identifying
 * this specific conversation (e.g. `${businessId}:${chatId}` for Telegram).
 * Used to keep short-term memory and the confirm-before-booking state.
 *
 * IMPORTANT for callers: only treat a booking as real when the returned
 * `confirmed` field is `true`. `intent === "book"` alone now just means
 * "the AI understood what you want" — it does NOT mean "go write this to
 * the database."
 */
export async function processUserMessage(
  sessionId: string,
  message: string,
  businessContext: any
): Promise<AIResponse> {
  const session = getSession(sessionId);
  const trimmed = message.trim();

  // -------------------------------------------------------------------
  // 1. If we're waiting on a yes/no for a previously-proposed booking,
  //    resolve that FIRST — deterministically, no AI call. This is what
  //    actually gates database writes on the caller's side.
  // -------------------------------------------------------------------
  if (session.pendingBooking) {
    if (AFFIRMATIVE_PATTERN.test(trimmed)) {
      const { service, date, time } = session.pendingBooking;
      session.pendingBooking = undefined;
      pushTurn(session, "user", message);
      const reply = `Great, you're all set! Booked *${service}* on ${date} at ${time}. See you then! 🎉`;
      pushTurn(session, "assistant", reply);
      return { intent: "book", service, date, time, confirmed: true, missingFields: [], reply };
    }

    if (NEGATIVE_PATTERN.test(trimmed)) {
      session.pendingBooking = undefined;
      pushTurn(session, "user", message);
      const reply = `No problem, I won't book that. What would you like to do instead?`;
      pushTurn(session, "assistant", reply);
      return { intent: "unknown", confirmed: false, missingFields: [], reply };
    }

    // Anything else: the customer moved on without a clear yes/no. Drop the
    // stale pending booking rather than keep re-asking about it forever,
    // and fall through to normal processing below.
    session.pendingBooking = undefined;
  }

  // -------------------------------------------------------------------
  // 2. Fast path — no AI call, still counts as a real conversation turn.
  // -------------------------------------------------------------------
  const fastAnswer = tryFastPathServicesAnswer(trimmed, businessContext);
  if (fastAnswer) {
    pushTurn(session, "user", message);
    pushTurn(session, "assistant", fastAnswer.reply);
    return fastAnswer;
  }

  // -------------------------------------------------------------------
  // 3. Full AI call, with recent history so follow-ups make sense.
  // -------------------------------------------------------------------
  let aiResponse: AIResponse;
  try {
    aiResponse = await enqueueProviderCall(trimmed, businessContext, session.history);
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

  pushTurn(session, "user", message);

  // -------------------------------------------------------------------
  // 4. If the AI extracted a COMPLETE booking, don't hand it back as
  //    ready-to-save. Hold it as pending and ask the customer to confirm.
  // -------------------------------------------------------------------
  const missing = aiResponse.missingFields || [];
  if (
    aiResponse.intent === "book" &&
    missing.length === 0 &&
    aiResponse.service &&
    aiResponse.date &&
    aiResponse.time
  ) {
    session.pendingBooking = {
      service: aiResponse.service,
      date: aiResponse.date,
      time: aiResponse.time,
    };
    aiResponse = {
      ...aiResponse,
      confirmed: false,
      reply: `Just to confirm — *${aiResponse.service}* on ${aiResponse.date} at ${aiResponse.time}. Shall I book it? (yes/no)`,
    };
  }

  pushTurn(session, "assistant", aiResponse.reply);
  return aiResponse;
}