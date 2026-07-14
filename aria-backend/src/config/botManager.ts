// import TelegramBot from "node-telegram-bot-api";
// import crypto from "crypto";
// import { BusinessModel } from "../models/businessModel";
// import { processUserMessage } from "../services/aiService";
// import appointmentRoutes from "../routes/appointmentRoutes"; // To borrow any schema pointers if needed
// import mongoose from "mongoose";

// // Use an inline loose schema structure if AppointmentModel is strongly bound to a single schema export
// const AppointmentSchema = new mongoose.Schema({}, { strict: false, collection: "appointments" });
// const DynamicAppointmentModel = mongoose.models.Appointments || mongoose.model("Appointments", AppointmentSchema);

// const activeBots: Record<string, TelegramBot> = {};

// /**
//  * Validates whether a token looks like a real Telegram token 
//  * and filters out common mock values used during test requests.
//  */
// function isValidToken(token: string): boolean {
//   if (!token) return false;
  
//   const lowerToken = token.toLowerCase();
//   // Filter out front-end placeholders and testing mocks
//   if (lowerToken.includes("mock") || lowerToken.includes("token") || lowerToken.includes("123456")) {
//     return false;
//   }
  
//   // A standard Telegram token usually contains a colon separating numbers from the hash
//   return token.includes(":");
// }

// export function startIndividualShopBot(business: any) {
//   const { _id, telegramBotToken, name } = business;

//   if (!telegramBotToken) return;

//   // Skip initialization entirely if the token is flagged as fake or mock
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
//       const text = msg.text;

//       if (!text || text.startsWith("/")) return;

//       try {
//         const aiResponse = await processUserMessage(text, business);
//         const missing = aiResponse.missingFields || [];

//         if (aiResponse.intent === "book" && missing.length === 0 && aiResponse.service && aiResponse.date && aiResponse.time) {
//           const appointmentId = crypto.randomUUID();
          
//           await DynamicAppointmentModel.create({
//             businessId: _id,
//             userId: chatId,
//             name: msg.chat.first_name || "Customer",
//             phone: "N/A",
//             businessType: business.businessType,
//             service: aiResponse.service,
//             date: aiResponse.date,
//             time: aiResponse.time,
//             id: appointmentId,
//             status: "pending"
//           });

//           bot.sendMessage(chatId, `${aiResponse.reply}\n\nYour appointment ID is ${appointmentId}.`);
//         } else {
//           bot.sendMessage(chatId, aiResponse.reply);
//         }
//       } catch (error) {
//         console.error(`Error on bot execution for ${name}:`, error);
//         bot.sendMessage(chatId, "Sorry, I'm having trouble syncing with the shop counter right now.");
//       }
//     });

//     // Capture explicit long-polling assignment errors to prevent process execution crashes
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
//   const businesses = await BusinessModel.find({ telegramBotToken: { $exists: true, $ne: "" } });
//   console.log(`[BotManager] Found ${businesses.length} registered business bots to deploy.`);
  
//   for (const business of businesses) {
//     try {
//       startIndividualShopBot(business);
//     } catch (err) {
//       console.error(`Failed to load bot for business ${business.name}:`, err);
//     }
//   }
// }
import TelegramBot from "node-telegram-bot-api";
import crypto from "crypto";
import { BusinessModel } from "../models/businessModel";
import { processUserMessage } from "../services/aiService";
import appointmentRoutes from "../routes/appointmentRoutes"; // To borrow any schema pointers if needed
import mongoose from "mongoose";

// Use an inline loose schema structure if AppointmentModel is strongly bound to a single schema export
const AppointmentSchema = new mongoose.Schema({}, { strict: false, collection: "appointments" });
const DynamicAppointmentModel = mongoose.models.Appointments || mongoose.model("Appointments", AppointmentSchema);

const activeBots: Record<string, TelegramBot> = {};

/**
 * Validates whether a token looks like a real Telegram token 
 * and filters out common mock values used during test requests.
 */
function isValidToken(token: string): boolean {
  if (!token) return false;
  
  const lowerToken = token.toLowerCase();
  // Filter out front-end placeholders and testing mocks
  if (lowerToken.includes("mock") || lowerToken.includes("token") || lowerToken.includes("123456")) {
    return false;
  }
  
  // A standard Telegram token usually contains a colon separating numbers from the hash
  return token.includes(":");
}

export function startIndividualShopBot(business: any) {
  const { _id, telegramBotToken, name } = business;

  if (!telegramBotToken) return;

  // Skip initialization entirely if the token is flagged as fake or mock
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

      // 1. Explicitly catch the /start command instead of discarding it
      if (text.startsWith("/start")) {
        const welcomeGreeting = `Hi there! Welcome to ${name}. I'm Aria, your AI appointment booking assistant. How can I help you today?`;
        bot.sendMessage(chatId, welcomeGreeting);
        return; // Break execution early so the slash command isn't forwarded to your AI service
      }

      // 2. Discard any other slash commands gracefully
      if (text.startsWith("/")) return;

      try {
        const aiResponse = await processUserMessage(text, business);
        const missing = aiResponse.missingFields || [];

        if (aiResponse.intent === "book" && missing.length === 0 && aiResponse.service && aiResponse.date && aiResponse.time) {
          const appointmentId = crypto.randomUUID();
          
          await DynamicAppointmentModel.create({
            businessId: _id,
            userId: chatId,
            name: msg.chat.first_name || "Customer",
            phone: "N/A",
            businessType: business.businessType,
            service: aiResponse.service,
            date: aiResponse.date,
            time: aiResponse.time,
            id: appointmentId,
            status: "pending"
          });

          bot.sendMessage(chatId, `${aiResponse.reply}\n\nYour appointment ID is ${appointmentId}.`);
        } else {
          bot.sendMessage(chatId, aiResponse.reply);
        }
      } catch (error) {
        console.error(`Error on bot execution for ${name}:`, error);
        bot.sendMessage(chatId, "Sorry, I'm having trouble syncing with the shop counter right now.");
      }
    });

    // Capture explicit long-polling assignment errors to prevent process execution crashes
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
  const businesses = await BusinessModel.find({ telegramBotToken: { $exists: true, $ne: "" } });
  console.log(`[BotManager] Found ${businesses.length} registered business bots to deploy.`);
  
  for (const business of businesses) {
    try {
      startIndividualShopBot(business);
    } catch (err) {
      console.error(`Failed to load bot for business ${business.name}:`, err);
    }
  }
}