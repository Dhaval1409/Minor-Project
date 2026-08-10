// /**
//  * FILENAME: src/config/botManager.ts
//  * DESCRIPTION: Handles automated provisioning and isolated stream handling for active shop bots.
//  */
// import TelegramBot from "node-telegram-bot-api";
// import { BusinessModel } from "../models/businessModel";
// import { AppointmentModel } from "../models/appointmentModel";
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
//         const aiResponse = await processUserMessage(text, liveBusiness);
//         const missing = aiResponse.missingFields || [];

//         // 🎯 1. Booking Flow
//         if (
//           aiResponse.intent === "book" &&
//           missing.length === 0 &&
//           aiResponse.service &&
//           aiResponse.date &&
//           aiResponse.time
//         ) {
//           const customerName = msg.chat.first_name
//             ? `${msg.chat.first_name} ${msg.chat.last_name || ""}`.trim()
//             : "Customer";

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

//           const sameDayAppointments = await AppointmentModel.findByBusinessAndDate(
//             _id.toString(),
//             aiResponse.date
//           );

//           if (hasBookingOverlap(sameDayAppointments, newStart, newEnd)) {
//             bot.sendMessage(
//               chatId,
//               `Sorry, that time slot on ${aiResponse.date} is already booked. 😕 Could you pick a different time? You can also ask me "what slots are free on ${aiResponse.date}" and I'll list them out for you.`
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

//         // 🎯 3. Default AI Conversation Response
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
 */
import TelegramBot from "node-telegram-bot-api";
import { BusinessModel } from "../models/businessModel";
import { AppointmentModel } from "../models/appointmentModel";
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
      const chatId = msg.chat.id.toString();
      const text = msg.text?.trim();

      if (!text) return;

      // Scopes the conversation memory to THIS business + THIS customer,
      // so two different shops (or two different customers) never bleed
      // context into each other even if a chatId were ever reused.
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
        bot.sendMessage(chatId, welcomeGreeting);
        return;
      }

      if (text.startsWith("/")) return;

      try {
        const aiResponse = await processUserMessage(sessionId, text, liveBusiness);

        // 🎯 1. Booking Flow — ONLY fires once the customer has confirmed.
        // (aiResponse.intent === "book" now also fires on the FIRST message
        // where all fields are known — that turn is just the confirmation
        // question and confirmed will be false, so it falls through to the
        // "default conversation reply" branch below instead of booking.)
        if (aiResponse.intent === "book" && aiResponse.confirmed && aiResponse.service && aiResponse.date && aiResponse.time) {
          const customerName = msg.chat.first_name
            ? `${msg.chat.first_name} ${msg.chat.last_name || ""}`.trim()
            : "Customer";

          const durationMinutes = computeDurationMinutes([aiResponse.service]);
          const newStart = parseTimeToMinutes(aiResponse.time);
          const newEnd = newStart + durationMinutes;

          if (Number.isNaN(newStart)) {
            bot.sendMessage(
              chatId,
              `Sorry, I couldn't understand that time clearly. Could you tell me the time again, like "3 PM" or "15:00"?`
            );
            return;
          }

          // Re-check for overlap at confirmation time, not just when the
          // slot was first proposed — a few messages may have passed
          // (during the confirm exchange) in which someone else could have
          // booked the same slot.
          const sameDayAppointments = await AppointmentModel.findByBusinessAndDate(
            _id.toString(),
            aiResponse.date
          );

          if (hasBookingOverlap(sameDayAppointments, newStart, newEnd)) {
            bot.sendMessage(
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

          bot.sendMessage(
            chatId,
            `${aiResponse.reply}\n\n📌 *Appointment ID:* \`${newAppointment.id}\``,
            { parse_mode: "Markdown" }
          );

        // 🎯 2. View User Appointments
        } else if (aiResponse.intent === "view") {
          const appointments = await AppointmentModel.findByUserId(chatId);
          const activeAppointments = appointments.filter(a => a.status !== "cancelled");

          if (activeAppointments.length === 0) {
            bot.sendMessage(chatId, "You have no active appointments booked with us.");
          } else {
            const listText = activeAppointments
              .map((a, i) => `${i + 1}. *${a.service}* on ${a.date} at ${a.time} (ID: \`${a.id}\`) - Status: _${a.status}_`)
              .join("\n");

            bot.sendMessage(
              chatId,
              `🗓️ *Your Active Appointments:*\n\n${listText}`,
              { parse_mode: "Markdown" }
            );
          }

        // 🎯 3. Default AI Conversation Response — also covers the
        //    "booking proposed, waiting on confirmation" turn, since that
        //    response already carries the right confirm-or-not reply text.
        } else {
          bot.sendMessage(chatId, aiResponse.reply);
        }

      } catch (error) {
        console.error(`Error on bot execution for ${name}:`, error);
        bot.sendMessage(chatId, "Sorry, I'm having trouble syncing with the shop counter right now.");
      }
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