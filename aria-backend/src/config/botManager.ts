// /**
//  * FILENAME: src/config/botManager.ts
//  * DESCRIPTION: Handles automated provisioning and isolated stream handling for active shop bots.
//  *
//  * ◄ UPDATED: works with aiService's new memory + confirm-before-booking
//  * flow. Two changes from before:
//  *   1. Builds a stable `sessionId` (businessId + chatId) and passes it into
//  *      processUserMessage() so the AI remembers the last few turns of this
//  *      specific customer's conversation with this specific shop.
//  *   2. Only writes an appointment to the database when
//  *      aiResponse.confirmed === true — intent === "book" alone no longer
//  *      means "save it," it just means "the AI understood the request and
//  *      is now waiting for the customer to say yes."
//  *
//  * ◄ UPDATED AGAIN: hooks lead capture into the chat flow.
//  *   - Every inbound message upserts/refreshes a lead record for that
//  *     customer, regardless of what the AI's intent turns out to be.
//  *   - When a booking actually completes, the matching lead is flipped to
//  *     "converted" so it drops out of any "needs follow-up" view.
//  */
// import TelegramBot from "node-telegram-bot-api";
// import { BusinessModel } from "../models/businessModel";
// import { AppointmentModel } from "../models/appointmentModel";
// import { LeadModel } from "../models/leadModel";
// import { processUserMessage } from "../services/aiService";
// import { parseTimeToMinutes, computeDurationMinutes, hasBookingOverlap } from "../utils/slotGenerator";

// const activeBots: Record<string, TelegramBot> = {};

// function isValidToken(token: string): boolean {
//   if (!token) return false;

//   const lowerToken = token.toLowerCase();
//   if (lowerToken.includes("mock") || lowerToken.includes("token") || lowerToken.includes("123456")) {
//     return false;
//   }

//   return token.includes(":");
// }

// // ◄ ADDED: fires on every inbound message so a lead record exists (and
// // stays fresh) for this customer, independent of whether they end up
// // booking, viewing appointments, or just chatting.
// async function captureLeadFromMessage({
//   businessId,
//   chatId,
//   customerName,
//   aiResponse,
// }: {
//   businessId: string;
//   chatId: string;
//   customerName: string;
//   aiResponse: any;
// }) {
//   try {
//     await LeadModel.upsertFromMessage({
//       businessId,
//       userId: chatId,
//       name: customerName,
//       enquiry: aiResponse.service || aiResponse.reply || "General enquiry",
//     });
//   } catch (err) {
//     console.error(`⚠️  [BotManager] Failed to capture lead for ${chatId}:`, err);
//   }
// }

// export function startIndividualShopBot(business: any) {
//   const { _id, telegramBotToken, name } = business;

//   if (!telegramBotToken) return;

//   if (!isValidToken(telegramBotToken)) {
//     console.log(`⚠️  [BotManager] Skipping initialization for "${name}" - Detected Mock/Invalid Token.`);
//     return;
//   }

//   if (activeBots[_id.toString()]) {
//     console.log(`[BotManager] Bot for ${name} is already active.`);
//     return;
//   }

//   try {
//     const bot = new TelegramBot(telegramBotToken, { polling: true });
//     activeBots[_id.toString()] = bot;

//     console.log(`🚀 [BotManager] Started individual AI employee for: ${name}`);

//     bot.on("message", async (msg) => {
//       const chatId = msg.chat.id.toString();
//       const text = msg.text?.trim();

//       if (!text) return;

//       // Scopes the conversation memory to THIS business + THIS customer,
//       // so two different shops (or two different customers) never bleed
//       // context into each other even if a chatId were ever reused.
//       const sessionId = `${_id.toString()}:${chatId}`;

//       let liveBusiness = business;
//       try {
//         const fresh = await BusinessModel.findById(_id);
//         if (fresh) liveBusiness = fresh;
//       } catch (fetchErr) {
//         console.error(`⚠️  [BotManager] Failed to refresh business data for ${name}, using cached copy:`, fetchErr);
//       }

//       if (text.startsWith("/start")) {
//         const welcomeGreeting = `Hi there! Welcome to ${liveBusiness.name}. I'm Aria, your AI appointment booking assistant. How can I help you today?`;
//         bot.sendMessage(chatId, welcomeGreeting);
//         return;
//       }

//       if (text.startsWith("/")) return;

//       try {
//         const aiResponse = await processUserMessage(sessionId, text, liveBusiness);

//         const customerName = msg.chat.first_name
//           ? `${msg.chat.first_name} ${msg.chat.last_name || ""}`.trim()
//           : "Customer";

//         // ◄ ADDED: log/refresh this customer's lead on every message,
//         // regardless of what happens next in the flow below.
//         captureLeadFromMessage({
//           businessId: _id.toString(),
//           chatId,
//           customerName,
//           aiResponse,
//         });

//         // 🎯 1. Booking Flow — ONLY fires once the customer has confirmed.
//         // (aiResponse.intent === "book" now also fires on the FIRST message
//         // where all fields are known — that turn is just the confirmation
//         // question and confirmed will be false, so it falls through to the
//         // "default conversation reply" branch below instead of booking.)
//         if (aiResponse.intent === "book" && aiResponse.confirmed && aiResponse.service && aiResponse.date && aiResponse.time) {
//           const durationMinutes = computeDurationMinutes([aiResponse.service]);
//           const newStart = parseTimeToMinutes(aiResponse.time);
//           const newEnd = newStart + durationMinutes;

//           if (Number.isNaN(newStart)) {
//             bot.sendMessage(
//               chatId,
//               `Sorry, I couldn't understand that time clearly. Could you tell me the time again, like "3 PM" or "15:00"?`
//             );
//             return;
//           }

//           // Re-check for overlap at confirmation time, not just when the
//           // slot was first proposed — a few messages may have passed
//           // (during the confirm exchange) in which someone else could have
//           // booked the same slot.
//           const sameDayAppointments = await AppointmentModel.findByBusinessAndDate(
//             _id.toString(),
//             aiResponse.date
//           );

//           if (hasBookingOverlap(sameDayAppointments, newStart, newEnd)) {
//             bot.sendMessage(
//               chatId,
//               `Sorry, that time slot on ${aiResponse.date} just got booked by someone else. 😕 Could you pick a different time? You can also ask me "what slots are free on ${aiResponse.date}" and I'll list them out for you.`
//             );
//             return;
//           }

//           const newAppointment = await AppointmentModel.create({
//             businessId: _id.toString(),
//             userId: chatId,
//             name: customerName,
//             phone: "N/A",
//             businessType: liveBusiness.businessType || "general",
//             service: aiResponse.service,
//             date: aiResponse.date,
//             time: aiResponse.time,
//           });

//           // ◄ ADDED: this enquiry just became a real booking — flip the
//           // lead over so it drops out of the "needs follow-up" view.
//           LeadModel.markConverted(_id.toString(), chatId).catch((err) => {
//             console.error(`⚠️  [BotManager] Failed to mark lead converted for ${chatId}:`, err);
//           });

//           bot.sendMessage(
//             chatId,
//             `${aiResponse.reply}\n\n📌 *Appointment ID:* \`${newAppointment.id}\``,
//             { parse_mode: "Markdown" }
//           );

//         // 🎯 2. View User Appointments
//         } else if (aiResponse.intent === "view") {
//           const appointments = await AppointmentModel.findByUserId(chatId);
//           const activeAppointments = appointments.filter(a => a.status !== "cancelled");

//           if (activeAppointments.length === 0) {
//             bot.sendMessage(chatId, "You have no active appointments booked with us.");
//           } else {
//             const listText = activeAppointments
//               .map((a, i) => `${i + 1}. *${a.service}* on ${a.date} at ${a.time} (ID: \`${a.id}\`) - Status: _${a.status}_`)
//               .join("\n");

//             bot.sendMessage(
//               chatId,
//               `🗓️ *Your Active Appointments:*\n\n${listText}`,
//               { parse_mode: "Markdown" }
//             );
//           }

//         // 🎯 3. Default AI Conversation Response — also covers the
//         //    "booking proposed, waiting on confirmation" turn, since that
//         //    response already carries the right confirm-or-not reply text.
//         } else {
//           bot.sendMessage(chatId, aiResponse.reply);
//         }

//       } catch (error) {
//         console.error(`Error on bot execution for ${name}:`, error);
//         bot.sendMessage(chatId, "Sorry, I'm having trouble syncing with the shop counter right now.");
//       }
//     });

//     bot.on("polling_error", (error: any) => {
//       if (error.message?.includes("404")) {
//         console.error(`❌ [BotManager] Telegram API returned 404 for "${name}". Stopping corrupt polling session.`);
//         try {
//           bot.stopPolling();
//         } catch (e) {}
//         delete activeBots[_id.toString()];
//       }
//     });

//   } catch (initErr) {
//     console.error(`❌ [BotManager] Fatal initialization exception for ${name}:`, initErr);
//   }
// }

// export async function initializeAllSaaS_Bots() {
//   try {
//     const businesses = await BusinessModel.find({ telegramBotToken: { $exists: true, $ne: "" } });
//     console.log(`[BotManager] Found ${businesses.length} registered business bots to deploy.`);

//     for (const business of businesses) {
//       try {
//         startIndividualShopBot(business);
//       } catch (err) {
//         console.error(`Failed to load bot for business ${business.name}:`, err);
//       }
//     }
//   } catch (dbErr) {
//     console.error("❌ Fatal background database query crash within BotManager entrypoint:", dbErr);
//   }
// }

/**
 * FILENAME: src/config/botManager.ts
 * DESCRIPTION: Handles automated provisioning and isolated stream handling for active shop bots.
 *
 * ◄ UPDATED: works with aiService's new memory + confirm-before-booking
 * flow. Two changes from before:
 *   1. Builds a stable `sessionId` (businessId + chatId) and passes it into
 *      processUserMessage() so the AI remembers the last few turns of this
 *      specific customer's conversation with this specific shop.
 *   2. Only writes an appointment to the database when
 *      aiResponse.confirmed === true — intent === "book" alone no longer
 *      means "save it," it just means "the AI understood the request and
 *      is now waiting for the customer to say yes."
 *
 * ◄ UPDATED AGAIN: hooks lead capture into the chat flow.
 *   - Every inbound message upserts/refreshes a lead record for that
 *     customer, regardless of what the AI's intent turns out to be.
 *   - When a booking actually completes, the matching lead is flipped to
 *     "converted" so it drops out of any "needs follow-up" view.
 *
 * ◄ UPDATED AGAIN: added webhook support so Telegram works on Vercel
 * serverless (polling can't survive there — see handleIncomingTelegramMessage
 * and setBusinessWebhook below).
 */
import TelegramBot from "node-telegram-bot-api";
import { BusinessModel } from "../models/businessModel";
import { AppointmentModel } from "../models/appointmentModel";
import { LeadModel } from "../models/leadModel";
import { processUserMessage } from "../services/aiService";
import { parseTimeToMinutes, computeDurationMinutes, hasBookingOverlap } from "../utils/slotGenerator";

const activeBots: Record<string, TelegramBot> = {};

function isValidToken(token: string): boolean {
  if (!token) return false;

  const lowerToken = token.toLowerCase();
  if (lowerToken.includes("mock") || lowerToken.includes("token") || lowerToken.includes("123456")) {
    return false;
  }

  return token.includes(":");
}

// ◄ ADDED: fires on every inbound message so a lead record exists (and
// stays fresh) for this customer, independent of whether they end up
// booking, viewing appointments, or just chatting.
async function captureLeadFromMessage({
  businessId,
  chatId,
  customerName,
  aiResponse,
}: {
  businessId: string;
  chatId: string;
  customerName: string;
  aiResponse: any;
}) {
  try {
    await LeadModel.upsertFromMessage({
      businessId,
      userId: chatId,
      name: customerName,
      enquiry: aiResponse.service || aiResponse.reply || "General enquiry",
    });
  } catch (err) {
    console.error(`⚠️  [BotManager] Failed to capture lead for ${chatId}:`, err);
  }
}

// ◄ ADDED (webhook support): a lightweight, non-polling client per business.
// This is safe to create on every serverless invocation — it does NOT open
// a persistent connection, it's just an HTTP client wrapper used to call
// sendMessage / setWebHook.
const clientBots: Record<string, TelegramBot> = {};

function getClientBot(business: any): TelegramBot | null {
  const { _id, telegramBotToken } = business;
  if (!isValidToken(telegramBotToken)) return null;

  const key = _id.toString();
  if (!clientBots[key]) {
    clientBots[key] = new TelegramBot(telegramBotToken); // no polling: true here
  }
  return clientBots[key];
}

// ◄ ADDED (webhook support): registers (or re-registers) the Telegram
// webhook for a single business, pointing at our serverless endpoint.
// Call this once per business whenever its token changes, or on demand
// from an admin/setup route. baseUrl should be the deployed backend
// origin, e.g. https://minor-project-five-iota.vercel.app
export async function setBusinessWebhook(business: any, baseUrl: string): Promise<{ ok: boolean; description?: string }> {
  const bot = getClientBot(business);
  if (!bot) {
    return { ok: false, description: "Invalid or missing Telegram bot token." };
  }

  const webhookUrl = `${baseUrl.replace(/\/$/, "")}/telegram/webhook/${business._id.toString()}`;

  try {
    const result = await bot.setWebHook(webhookUrl);
    console.log(`🔗 [BotManager] Webhook set for "${business.name}" -> ${webhookUrl}`, result);
    return { ok: true };
  } catch (err: any) {
    console.error(`❌ [BotManager] Failed to set webhook for "${business.name}":`, err.message || err);
    return { ok: false, description: err.message || String(err) };
  }
}

// ◄ ADDED (webhook support): the actual message-handling logic, extracted
// out of the old polling bot.on("message", ...) callback so it can be
// reused by BOTH the local-dev polling bot AND the production webhook
// route. No behavioral changes from the original logic — just moved so
// it can run per-request instead of inside a long-lived listener.
export async function handleIncomingTelegramMessage(business: any, msg: any) {
  const bot = getClientBot(business);
  if (!bot) {
    console.error(`⚠️  [BotManager] No valid bot client for "${business?.name}" — cannot handle message.`);
    return;
  }

  const { _id, name } = business;
  const chatId = msg.chat.id.toString();
  const text = msg.text?.trim();

  if (!text) return;

  const sessionId = `${_id.toString()}:${chatId}`;

  let liveBusiness = business;
  try {
    const fresh = await BusinessModel.findById(_id);
    if (fresh) liveBusiness = fresh;
  } catch (fetchErr) {
    console.error(`⚠️  [BotManager] Failed to refresh business data for ${name}, using cached copy:`, fetchErr);
  }

  if (text.startsWith("/start")) {
    const welcomeGreeting = `Hi there! Welcome to ${liveBusiness.name}. I'm Aria, your AI appointment booking assistant. How can I help you today?`;
    await bot.sendMessage(chatId, welcomeGreeting);
    return;
  }

  if (text.startsWith("/")) return;

  try {
    const aiResponse = await processUserMessage(sessionId, text, liveBusiness);

    const customerName = msg.chat.first_name
      ? `${msg.chat.first_name} ${msg.chat.last_name || ""}`.trim()
      : "Customer";

    // ◄ ADDED: log/refresh this customer's lead on every message,
    // regardless of what happens next in the flow below.
    captureLeadFromMessage({
      businessId: _id.toString(),
      chatId,
      customerName,
      aiResponse,
    });

    // 🎯 1. Booking Flow — ONLY fires once the customer has confirmed.
    if (aiResponse.intent === "book" && aiResponse.confirmed && aiResponse.service && aiResponse.date && aiResponse.time) {
      const durationMinutes = computeDurationMinutes([aiResponse.service]);
      const newStart = parseTimeToMinutes(aiResponse.time);
      const newEnd = newStart + durationMinutes;

      if (Number.isNaN(newStart)) {
        await bot.sendMessage(
          chatId,
          `Sorry, I couldn't understand that time clearly. Could you tell me the time again, like "3 PM" or "15:00"?`
        );
        return;
      }

      const sameDayAppointments = await AppointmentModel.findByBusinessAndDate(
        _id.toString(),
        aiResponse.date
      );

      if (hasBookingOverlap(sameDayAppointments, newStart, newEnd)) {
        await bot.sendMessage(
          chatId,
          `Sorry, that time slot on ${aiResponse.date} just got booked by someone else. 😕 Could you pick a different time? You can also ask me "what slots are free on ${aiResponse.date}" and I'll list them out for you.`
        );
        return;
      }

      const newAppointment = await AppointmentModel.create({
        businessId: _id.toString(),
        userId: chatId,
        name: customerName,
        phone: "N/A",
        businessType: liveBusiness.businessType || "general",
        service: aiResponse.service,
        date: aiResponse.date,
        time: aiResponse.time,
      });

      LeadModel.markConverted(_id.toString(), chatId).catch((err) => {
        console.error(`⚠️  [BotManager] Failed to mark lead converted for ${chatId}:`, err);
      });

      await bot.sendMessage(
        chatId,
        `${aiResponse.reply}\n\n📌 *Appointment ID:* \`${newAppointment.id}\``,
        { parse_mode: "Markdown" }
      );

    // 🎯 2. View User Appointments
    } else if (aiResponse.intent === "view") {
      const appointments = await AppointmentModel.findByUserId(chatId);
      const activeAppointments = appointments.filter((a: any) => a.status !== "cancelled");

      if (activeAppointments.length === 0) {
        await bot.sendMessage(chatId, "You have no active appointments booked with us.");
      } else {
        const listText = activeAppointments
          .map((a: any, i: number) => `${i + 1}. *${a.service}* on ${a.date} at ${a.time} (ID: \`${a.id}\`) - Status: _${a.status}_`)
          .join("\n");

        await bot.sendMessage(
          chatId,
          `🗓️ *Your Active Appointments:*\n\n${listText}`,
          { parse_mode: "Markdown" }
        );
      }

    // 🎯 3. Default AI Conversation Response
    } else {
      await bot.sendMessage(chatId, aiResponse.reply);
    }

  } catch (error) {
    console.error(`Error on bot execution for ${name}:`, error);
    await bot.sendMessage(chatId, "Sorry, I'm having trouble syncing with the shop counter right now.");
  }
}

// Local-dev-only polling starter (kept for `npm run dev` on your PC).
// This is NEVER invoked on Vercel — see the NODE_ENV guard in src/index.ts.
export function startIndividualShopBot(business: any) {
  const { _id, telegramBotToken, name } = business;

  if (!telegramBotToken) return;

  if (!isValidToken(telegramBotToken)) {
    console.log(`⚠️  [BotManager] Skipping initialization for "${name}" - Detected Mock/Invalid Token.`);
    return;
  }

  if (activeBots[_id.toString()]) {
    console.log(`[BotManager] Bot for ${name} is already active.`);
    return;
  }

  try {
    const bot = new TelegramBot(telegramBotToken, { polling: true });
    activeBots[_id.toString()] = bot;

    console.log(`🚀 [BotManager] Started individual AI employee for: ${name}`);

    bot.on("message", async (msg) => {
      await handleIncomingTelegramMessage(business, msg);
    });

    bot.on("polling_error", (error: any) => {
      if (error.message?.includes("404")) {
        console.error(`❌ [BotManager] Telegram API returned 404 for "${name}". Stopping corrupt polling session.`);
        try {
          bot.stopPolling();
        } catch (e) {}
        delete activeBots[_id.toString()];
      }
    });

  } catch (initErr) {
    console.error(`❌ [BotManager] Fatal initialization exception for ${name}:`, initErr);
  }
}

export async function initializeAllSaaS_Bots() {
  try {
    const businesses = await BusinessModel.find({ telegramBotToken: { $exists: true, $ne: "" } });
    console.log(`[BotManager] Found ${businesses.length} registered business bots to deploy.`);

    for (const business of businesses) {
      try {
        startIndividualShopBot(business);
      } catch (err) {
        console.error(`Failed to load bot for business ${business.name}:`, err);
      }
    }
  } catch (dbErr) {
    console.error("❌ Fatal background database query crash within BotManager entrypoint:", dbErr);
  }
}