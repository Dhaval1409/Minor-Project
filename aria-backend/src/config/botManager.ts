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

// /**
//  * Validates whether a token looks like a real Telegram token
//  * and filters out common mock values used during test requests.
//  */
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

//       // FIX: re-fetch the business record fresh from the DB on every message,
//       // instead of reusing the `business` object captured once at server
//       // startup. Previously, any edit to services/hours/name after boot
//       // (via dashboard Settings, direct DB edit, etc.) was invisible to the
//       // running bot until the whole server restarted. This keeps Aria's
//       // context always current.
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

//           // ◄ ADDED: overlap check — mirrors the dashboard/API booking flow.
//           // Chat bookings used to call AppointmentModel.create() directly with
//           // ZERO double-booking protection, which is how the same slot ended
//           // up booked 4 times over. This uses the exact same shared logic
//           // (slotGenerator.ts) that appointmentController.ts uses, so both
//           // booking paths are always in sync.
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

//           // Use shared AppointmentModel to ensure uniform structure and trigger indexes
//           const newAppointment = await AppointmentModel.create({
//             businessId: _id.toString(),
//             userId: chatId, // Telegram Chat ID mapped as primary user lookup
//             name: customerName,
//             phone: "N/A", // Can be updated if phone prompt flow is added
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
        const aiResponse = await processUserMessage(text, liveBusiness);
        const missing = aiResponse.missingFields || [];

        // 🎯 1. Booking Flow
        if (
          aiResponse.intent === "book" &&
          missing.length === 0 &&
          aiResponse.service &&
          aiResponse.date &&
          aiResponse.time
        ) {
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

          const sameDayAppointments = await AppointmentModel.findByBusinessAndDate(
            _id.toString(),
            aiResponse.date
          );

          if (hasBookingOverlap(sameDayAppointments, newStart, newEnd)) {
            bot.sendMessage(
              chatId,
              `Sorry, that time slot on ${aiResponse.date} is already booked. 😕 Could you pick a different time? You can also ask me "what slots are free on ${aiResponse.date}" and I'll list them out for you.`
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

        // 🎯 3. Default AI Conversation Response
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