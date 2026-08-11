/**
 * FILENAME: src/routes/telegramRoutes.ts
 */
import express from "express";
import { receiveTelegramUpdate, registerWebhook } from "../controllers/telegramController";

const router = express.Router();

// Telegram calls this directly — no auth (Telegram doesn't send your JWT).
// The businessId in the path is what scopes the update to the right shop.
router.post("/webhook/:businessId", receiveTelegramUpdate);

// You call this yourself (once per business / whenever the token changes)
// to tell Telegram where to deliver updates.
router.post("/register-webhook/:businessId", registerWebhook);

export default router;