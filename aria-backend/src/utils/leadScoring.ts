/**
 * FILENAME: src/utils/leadScoring.ts
 *
 * Heuristic lead-scoring engine. Turns raw engagement signals from a
 * customer's conversation with Aria into a single 0-100 "how likely / how
 * urgent is this lead" score, so the dashboard can rank leads instead of
 * just listing them in arrival order.
 *
 * This is a transparent, weighted rule-based model (not a trained ML
 * model) — every input signal and its weight is documented below, and
 * getScoreBreakdown() exposes the per-factor contribution so it can be
 * explained on demand rather than being a black box.
 *
 * Signals used:
 *   1. RECENCY      — how long ago the customer last messaged. A lead that
 *                      went cold three days ago is worth less than one from
 *                      ten minutes ago.
 *   2. ENGAGEMENT    — how many messages they've exchanged with Aria.
 *                      More back-and-forth signals real intent, not a
 *                      one-line drive-by question.
 *   3. INTENT DEPTH  — how close their enquiry got to a complete booking
 *                      (service + date + time). Fewer missing fields means
 *                      Aria had almost closed the booking.
 *   4. SOURCE WEIGHT — a missed call is generally a hotter lead than a
 *                      passive chat message, since it took more effort.
 */

import { Lead, LeadSource } from "../models/leadModel";

export interface LeadScoreBreakdown {
  recency: number;
  engagement: number;
  intentDepth: number;
  source: number;
  total: number;
}

const WEIGHTS = {
  recency: 40,
  engagement: 25,
  intentDepth: 25,
  source: 10,
};

const SOURCE_WEIGHT: Record<LeadSource, number> = {
  telegram_call: 1,
  whatsapp: 0.8,
  telegram_chat: 0.6,
  manual: 0.5,
};

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

/** Exponential decay: fresh messages score near 1, anything past ~48h trails to near 0. */
function recencyFactor(lastMessageAt: string | Date): number {
  const last = new Date(lastMessageAt).getTime();
  const hoursSince = (Date.now() - last) / (1000 * 60 * 60);
  if (Number.isNaN(hoursSince) || hoursSince < 0) return 1;
  return clamp(Math.exp(-hoursSince / 24), 0, 1); // half-life ≈ 24h
}

/** More turns = more genuine interest, but with diminishing returns past ~6 turns. */
function engagementFactor(messageCount: number): number {
  return clamp(Math.log(1 + messageCount) / Math.log(7), 0, 1);
}

/** 0 missing fields (booking-ready) = 1.0, fully unqualified enquiry = closer to 0. */
function intentDepthFactor(missingFieldsCount: number): number {
  const MAX_EXPECTED_MISSING = 3; // service, date, time
  return clamp(1 - missingFieldsCount / MAX_EXPECTED_MISSING, 0, 1);
}

function sourceFactor(source: LeadSource): number {
  return SOURCE_WEIGHT[source] ?? 0.6;
}

export function getScoreBreakdown(input: {
  lastMessageAt: string | Date;
  messageCount: number;
  missingFieldsCount: number;
  source: LeadSource;
}): LeadScoreBreakdown {
  const recency = recencyFactor(input.lastMessageAt) * WEIGHTS.recency;
  const engagement = engagementFactor(input.messageCount) * WEIGHTS.engagement;
  const intentDepth = intentDepthFactor(input.missingFieldsCount) * WEIGHTS.intentDepth;
  const source = sourceFactor(input.source) * WEIGHTS.source;

  const total = clamp(Math.round(recency + engagement + intentDepth + source), 0, 100);

  return {
    recency: Math.round(recency),
    engagement: Math.round(engagement),
    intentDepth: Math.round(intentDepth),
    source: Math.round(source),
    total,
  };
}

export function scoreToLabel(score: number): "Hot" | "Warm" | "Cold" {
  if (score >= 70) return "Hot";
  if (score >= 40) return "Warm";
  return "Cold";
}

/** Convenience wrapper for the common case of scoring a persisted Lead doc. */
export function scoreLead(lead: Pick<Lead, "lastMessageAt" | "messageCount" | "missingFieldsCount" | "source">): {
  score: number;
  label: "Hot" | "Warm" | "Cold";
  breakdown: LeadScoreBreakdown;
} {
  const breakdown = getScoreBreakdown({
    lastMessageAt: lead.lastMessageAt,
    messageCount: lead.messageCount,
    missingFieldsCount: lead.missingFieldsCount,
    source: lead.source,
  });
  return { score: breakdown.total, label: scoreToLabel(breakdown.total), breakdown };
}