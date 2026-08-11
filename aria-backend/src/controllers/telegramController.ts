/**
 * FILENAME: src/controllers/telegramController.ts
 * DESCRIPTION: Handles inbound Telegram webhook calls (production, on Vercel)
 * and the one-time/on-demand registration of a business's webhook URL with
 * Telegram (replaces the old polling-based bot startup, which cannot run
 * on serverless).
 */
import { Request, Response } from "express";
import BusinessModel from "../models/businessModel";
import { handleIncomingTelegramMessage, setBusinessWebhook } from "../config/botManager";

// POST /telegram/webhook/:businessId
// Telegram calls this URL directly every time a message is sent to the bot.
export const receiveTelegramUpdate = async (req: Request, res: Response) => {
  // Always ack quickly with 200 so Telegram doesn't retry/backoff on us,
  // even if something below fails — errors are logged, not surfaced to Telegram.
  res.status(200).json({ ok: true });

  try {
    const { businessId } = req.params;
    const update = req.body;

    const message = update?.message;
    if (!message) return; // ignore edited_message, callback_query, etc. for now

    const business = await BusinessModel.findById(businessId);
    if (!business || !business.telegramBotToken) {
      console.error(`[TelegramWebhook] No business/token found for id ${businessId}`);
      return;
    }

    await handleIncomingTelegramMessage(business, message);
  } catch (err) {
    console.error("[TelegramWebhook] Failed to process update:", err);
  }
};

// POST /telegram/register-webhook/:businessId
// Call this once (or whenever the token changes) to tell Telegram where to
// send updates for this business's bot. Uses APP_BASE_URL env var, or you
// can override with { "baseUrl": "https://your-backend.vercel.app" } in the body.
export const registerWebhook = async (req: Request, res: Response) => {
  try {
    const { businessId } = req.params;
    const business = await BusinessModel.findById(businessId);

    if (!business) {
      return res.status(404).json({ success: false, message: "Business not found" });
    }
    if (!business.telegramBotToken) {
      return res.status(400).json({ success: false, message: "This business has no telegramBotToken set" });
    }

    const baseUrl = req.body?.baseUrl || process.env.APP_BASE_URL;
    if (!baseUrl) {
      return res.status(400).json({
        success: false,
        message: "No base URL available. Set APP_BASE_URL env var on Vercel, or pass { baseUrl } in the request body.",
      });
    }

    const result = await setBusinessWebhook(business, baseUrl);

    if (!result.ok) {
      return res.status(500).json({ success: false, message: result.description });
    }

    res.status(200).json({
      success: true,
      message: `Webhook registered for "${business.name}"`,
      webhookUrl: `${baseUrl.replace(/\/$/, "")}/telegram/webhook/${business._id}`,
    });
  } catch (err: any) {
    console.error("[TelegramWebhook] registerWebhook failed:", err);
    res.status(500).json({ success: false, message: err.message || "Failed to register webhook" });
  }
};