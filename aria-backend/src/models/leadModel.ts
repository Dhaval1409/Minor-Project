/**
 * FILENAME: src/models/leadModel.ts
 *
 * Type definitions + Mongoose persistent database layer for LEADS.
 *
 * A "lead" is any enquiry Aria has had with a customer that hasn't (yet)
 * turned into a confirmed appointment — captured automatically from the
 * chat flow in botManager.ts, and scored by utils/leadScoring.ts so the
 * dashboard can surface the ones most worth a human follow-up first.
 */

import { Schema, model, models, Document } from "mongoose";
import { v4 as uuidv4 } from "uuid";

// ---------------------------------------------------------------------------
// Enums / literal unions
// ---------------------------------------------------------------------------

export type LeadStatus = "new" | "contacted" | "scheduled" | "converted" | "lost";

export const LEAD_STATUSES: LeadStatus[] = [
  "new",
  "contacted",
  "scheduled",
  "converted",
  "lost",
];

export type LeadSource = "telegram_call" | "telegram_chat" | "whatsapp" | "manual";

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

export interface Lead {
  id: string;
  businessId: string;
  userId: string; // chat/session id this lead was captured from
  name: string;
  phone?: string;
  enquiry: string; // best-known summary of what they asked about, e.g. "Bridal package"
  source: LeadSource;
  status: LeadStatus;
  messageCount: number; // how many turns this customer has sent Aria — engagement signal
  missingFieldsCount: number; // how close their last enquiry got to a complete booking
  followUpAt?: string; // human-readable next follow-up slot, e.g. "Tomorrow, 11am"
  score: number; // 0-100, computed by leadScoring.ts
  scoreLabel: "Hot" | "Warm" | "Cold";
  firstMessageAt: string;
  lastMessageAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpsertLeadInput {
  businessId: string;
  userId: string;
  name?: string;
  phone?: string;
  enquiry?: string;
  source?: LeadSource;
  missingFieldsCount?: number;
}

// ---------------------------------------------------------------------------
// Mongoose Schema Definition
// ---------------------------------------------------------------------------

interface ILeadDoc extends Document {
  id: string;
  businessId: string;
  userId: string;
  name: string;
  phone?: string;
  enquiry: string;
  source: LeadSource;
  status: LeadStatus;
  messageCount: number;
  missingFieldsCount: number;
  followUpAt?: string;
  score: number;
  scoreLabel: "Hot" | "Warm" | "Cold";
  firstMessageAt: Date;
  lastMessageAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const LeadSchema = new Schema<ILeadDoc>(
  {
    id: { type: String, required: true, unique: true, index: true },
    businessId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true, default: "Customer" },
    phone: { type: String, trim: true, default: "" },
    enquiry: { type: String, trim: true, default: "General enquiry" },
    source: { type: String, default: "telegram_chat" },
    status: { type: String, enum: LEAD_STATUSES, default: "new", index: true },
    messageCount: { type: Number, default: 1 },
    missingFieldsCount: { type: Number, default: 0 },
    followUpAt: { type: String, default: "" },
    score: { type: Number, default: 0, index: true },
    scoreLabel: { type: String, default: "Cold" },
    firstMessageAt: { type: Date, default: () => new Date() },
    lastMessageAt: { type: Date, default: () => new Date(), index: true },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret: Record<string, any>) => {
        delete ret._id;
        delete ret.__v;
        if (ret.createdAt instanceof Date) ret.createdAt = ret.createdAt.toISOString();
        if (ret.updatedAt instanceof Date) ret.updatedAt = ret.updatedAt.toISOString();
        if (ret.firstMessageAt instanceof Date) ret.firstMessageAt = ret.firstMessageAt.toISOString();
        if (ret.lastMessageAt instanceof Date) ret.lastMessageAt = ret.lastMessageAt.toISOString();
        return ret;
      },
    },
  }
);

// One lead per (business, customer) — repeat messages update the same lead
// rather than spawning duplicates.
LeadSchema.index({ businessId: 1, userId: 1 }, { unique: true });

const MongooseLeadModel = models.Lead || model<ILeadDoc>("Lead", LeadSchema);

// ---------------------------------------------------------------------------
// Database Layer
// ---------------------------------------------------------------------------

function deHydrate(doc: any): Lead {
  if (!doc) return undefined as any;
  if (typeof doc.toJSON !== "function") {
    const { _id, __v, ...rest } = doc;
    return {
      ...rest,
      createdAt: doc.createdAt instanceof Date ? doc.createdAt.toISOString() : doc.createdAt,
      updatedAt: doc.updatedAt instanceof Date ? doc.updatedAt.toISOString() : doc.updatedAt,
      firstMessageAt: doc.firstMessageAt instanceof Date ? doc.firstMessageAt.toISOString() : doc.firstMessageAt,
      lastMessageAt: doc.lastMessageAt instanceof Date ? doc.lastMessageAt.toISOString() : doc.lastMessageAt,
    } as Lead;
  }
  return doc.toJSON() as Lead;
}

export const LeadModel = {
  async findAllByBusiness(businessId: string): Promise<Lead[]> {
    const docs = await MongooseLeadModel.find({ businessId }).sort({ score: -1, lastMessageAt: -1 }).lean();
    return docs.map((doc) => deHydrate(doc));
  },

  async findAll(): Promise<Lead[]> {
    const docs = await MongooseLeadModel.find().sort({ score: -1, lastMessageAt: -1 }).lean();
    return docs.map((doc) => deHydrate(doc));
  },

  async findById(id: string): Promise<Lead | undefined> {
    const doc = await MongooseLeadModel.findOne({ id }).lean();
    return doc ? deHydrate(doc) : undefined;
  },

  async findByBusinessAndUser(businessId: string, userId: string): Promise<Lead | undefined> {
    const doc = await MongooseLeadModel.findOne({ businessId, userId }).lean();
    return doc ? deHydrate(doc) : undefined;
  },

  /**
   * Creates the lead on first contact, or updates the existing one for this
   * (businessId, userId) pair on every subsequent message — bumping
   * messageCount and lastMessageAt so the scoring function in
   * leadScoring.ts always has fresh engagement/recency signals to work with.
   */
  async upsertFromMessage(input: UpsertLeadInput): Promise<Lead> {
    const now = new Date();
    const existing = await MongooseLeadModel.findOne({ businessId: input.businessId, userId: input.userId });

    if (existing) {
      existing.messageCount = (existing.messageCount || 0) + 1;
      existing.lastMessageAt = now;
      if (input.enquiry) existing.enquiry = input.enquiry;
      if (input.name) existing.name = input.name;
      if (input.phone) existing.phone = input.phone;
      if (typeof input.missingFieldsCount === "number") existing.missingFieldsCount = input.missingFieldsCount;
      await existing.save();
      return deHydrate(existing);
    }

    const doc = await MongooseLeadModel.create({
      id: uuidv4(),
      businessId: input.businessId,
      userId: input.userId,
      name: input.name || "Customer",
      phone: input.phone || "",
      enquiry: input.enquiry || "General enquiry",
      source: input.source || "telegram_chat",
      status: "new",
      messageCount: 1,
      missingFieldsCount: input.missingFieldsCount ?? 0,
      firstMessageAt: now,
      lastMessageAt: now,
    });
    return deHydrate(doc);
  },

  async applyScore(id: string, score: number, scoreLabel: "Hot" | "Warm" | "Cold"): Promise<void> {
    await MongooseLeadModel.updateOne({ id }, { $set: { score, scoreLabel } });
  },

  async updateStatus(id: string, status: LeadStatus, followUpAt?: string): Promise<Lead | undefined> {
    const patch: Record<string, any> = { status };
    if (typeof followUpAt === "string") patch.followUpAt = followUpAt;
    const doc = await MongooseLeadModel.findOneAndUpdate({ id }, { $set: patch }, { new: true });
    return doc ? deHydrate(doc) : undefined;
  },

  /** Called once an enquiry actually turns into a confirmed appointment. */
  async markConverted(businessId: string, userId: string): Promise<void> {
    await MongooseLeadModel.updateOne(
      { businessId, userId },
      { $set: { status: "converted", followUpAt: "" } }
    );
  },

  async delete(id: string): Promise<boolean> {
    const result = await MongooseLeadModel.deleteOne({ id });
    return result.deletedCount > 0;
  },
};