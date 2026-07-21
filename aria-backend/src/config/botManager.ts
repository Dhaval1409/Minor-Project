/**
 * FILENAME: src/config/botManager.ts
 * DESCRIPTION: Handles automated provisioning and isolated stream handling for active shop bots.
 */
import TelegramBot from "node-telegram-bot-api";
import { BusinessModel } from "../models/businessModel";
import { AppointmentModel } from "../models/appointmentModel";
import { processUserMessage } from "../services/aiService";

const activeBots: Record<string, TelegramBot> = {};

/**
 * Validates whether a token looks like a real Telegram token 
 * and filters out common mock values used during test requests.
 */
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

      if (text.startsWith("/start")) {
        const welcomeGreeting = `Hi there! Welcome to ${name}. I'm Aria, your AI appointment booking assistant. How can I help you today?`;
        bot.sendMessage(chatId, welcomeGreeting);
        return; 
      }

      if (text.startsWith("/")) return;

      try {
        const aiResponse = await processUserMessage(text, business);
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

          // Use shared AppointmentModel to ensure uniform structure and trigger indexes
          const newAppointment = await AppointmentModel.create({
            businessId: _id.toString(),
            userId: chatId, // Telegram Chat ID mapped as primary user lookup
            name: customerName,
            phone: "N/A", // Can be updated if phone prompt flow is added
            businessType: business.businessType || "general",
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