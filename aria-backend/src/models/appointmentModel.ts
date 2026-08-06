/**
 * FILENAME: src/models/appointmentModel.ts
 *
 * Type definitions + Mongoose persistent database layer for appointments.
 * Refactored to use MongoDB via Mongoose, maintaining exact method signatures 
 * so that controllers do not break.
 *
 * ◄ CHANGED: appointments now support MULTIPLE services per booking.
 *   Rule: each service = a fixed 30-minute slot, so durationMinutes = 30 * services.length
 *   (1 service = 30 min, 2 = 60 min, 3 = 90 min, etc). This drives the
 *   overlap/double-booking check in appointmentController.ts.
 *
 *   `service` (singular string) is kept as a derived, human-readable field
 *   (e.g. "Haircut + Facial") purely so existing UI/Telegram-message code
 *   that reads `appointment.service` keeps working without changes.
 */

import { Schema, model, models, Document } from "mongoose";
import { v4 as uuidv4 } from "uuid";

// ---------------------------------------------------------------------------
// Enums / literal unions
// ---------------------------------------------------------------------------

export type AppointmentStatus =
  | "pending"
  | "confirmed"
  | "cancelled"
  | "completed"
  | "rescheduled";

export const APPOINTMENT_STATUSES: AppointmentStatus[] = [
  "pending",
  "confirmed",
  "cancelled",
  "completed",
  "rescheduled",
];

// Fixed slot size in minutes. Every service booked adds one more slot.
export const SLOT_MINUTES = 30;

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

export interface User {
  id: string;
  name: string;
  phone: string;
  telegramChatId?: string;
}

export interface Appointment {
  id: string;
  businessId?: string; // Links appointment to a specific SaaS tenant
  userId: string;
  name: string;
  phone: string;
  businessType: string; // Made generic string to handle flexible SaaS onboarding types
  services: string[]; // ◄ CHANGED: multiple services can be booked at once
  service: string; // ◄ Legacy/derived display string, e.g. "Haircut + Facial"
  durationMinutes: number; // ◄ ADDED: 30 * services.length
  date: string; // ISO date string, e.g. "2026-07-10"
  time: string; // e.g. "17:00"
  status: AppointmentStatus;
  createdAt: string;
  updatedAt: string;
}

/** Shape of the payload used to create a new appointment. */
export interface BookingRequest {
  businessId?: string;
  userId?: string;
  name: string;
  phone: string;
  businessType: string;
  services?: string[]; // ◄ CHANGED: preferred field going forward
  service?: string;    // ◄ Still accepted for backward compatibility (single service)
  date: string;
  time: string;
}

/** Shape of the payload used to update/reschedule an appointment. */
export interface UpdateAppointmentRequest {
  name?: string;
  phone?: string;
  businessType?: string;
  services?: string[];
  service?: string;
  durationMinutes?: number;
  date?: string;
  time?: string;
  status?: AppointmentStatus;
}

/** Standardized structured response returned by the AI layer. */
export interface AIResponse {
  intent: "book" | "view" | "cancel" | "reschedule" | "unknown";
  businessType?: string;
  service?: string;
  date?: string;
  time?: string;
  reply: string; // natural language reply to send back to the user
  missingFields?: string[];
}

// ---------------------------------------------------------------------------
// Mongoose Schema Definition
// ---------------------------------------------------------------------------

interface IAppointmentDoc extends Document {
  id: string;
  businessId?: string;
  userId: string;
  name: string;
  phone: string;
  businessType: string;
  services: string[];
  service: string;
  durationMinutes: number;
  date: string;
  time: string;
  status: AppointmentStatus;
  createdAt: Date;
  updatedAt: Date;
}

const AppointmentSchema = new Schema<IAppointmentDoc>(
  {
    id: { type: String, required: true, unique: true, index: true },
    businessId: { type: String, default: "", index: true },
    userId: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    businessType: { type: String, required: true },
    services: {
      type: [String],
      required: true,
      validate: {
        validator: (v: string[]) => Array.isArray(v) && v.length > 0,
        message: "At least one service is required.",
      },
    },
    service: { type: String, required: true }, // derived display string, kept in sync on write
    durationMinutes: { type: Number, required: true, default: SLOT_MINUTES },
    date: { type: String, required: true, index: true },
    time: { type: String, required: true },
    status: { type: String, enum: APPOINTMENT_STATUSES, default: "pending", index: true },
  },
  { 
    timestamps: true,
    toJSON: {
      transform: (doc, ret: Record<string, any>) => {
        delete ret._id;
        delete ret.__v;
        if (ret.createdAt instanceof Date) ret.createdAt = ret.createdAt.toISOString();
        if (ret.updatedAt instanceof Date) ret.updatedAt = ret.updatedAt.toISOString();
        return ret;
      }
    }
  }
);

// Compound index: overlap checks always filter by businessId + date, so this
// keeps that query fast as appointment volume grows.
AppointmentSchema.index({ businessId: 1, date: 1, status: 1 });

// Check models cache to prevent HMR recompilation errors
const MongooseAppointmentModel = 
  models.Appointment || model<IAppointmentDoc>("Appointment", AppointmentSchema);

// ---------------------------------------------------------------------------
// Synchronous-wrapper Database Layer mapped to Mongoose Async Promises
// ---------------------------------------------------------------------------

function deHydrate(doc: any): Appointment {
  if (!doc) return undefined as any;
  // If it's already a plain object via lean()
  if (typeof doc.toJSON !== "function") {
    const { _id, __v, ...rest } = doc;
    return {
      ...rest,
      createdAt: doc.createdAt instanceof Date ? doc.createdAt.toISOString() : doc.createdAt,
      updatedAt: doc.updatedAt instanceof Date ? doc.updatedAt.toISOString() : doc.updatedAt,
    } as Appointment;
  }
  return doc.toJSON() as Appointment;
}

/** Normalizes either `services: string[]` or legacy `service: string` into a clean array. */
function normalizeServices(data: { services?: string[]; service?: string }): string[] {
  if (Array.isArray(data.services) && data.services.length > 0) {
    return data.services.map((s) => s.trim()).filter(Boolean);
  }
  if (data.service && data.service.trim()) {
    return [data.service.trim()];
  }
  return [];
}

export const AppointmentModel = {
  async create(data: BookingRequest): Promise<Appointment> {
    const services = normalizeServices(data);

    if (services.length === 0) {
      throw new Error("At least one service is required to book an appointment.");
    }

    const appointmentData = {
      id: uuidv4(),
      businessId: data.businessId ?? "",
      userId: data.userId ?? uuidv4(),
      name: data.name,
      phone: data.phone,
      businessType: data.businessType,
      services,
      service: services.join(" + "), // e.g. "Haircut + Facial" — legacy display field
      durationMinutes: services.length * SLOT_MINUTES, // 30 / 60 / 90 / ...
      date: data.date,
      time: data.time,
      status: "pending" as AppointmentStatus,
    };
    
    const doc = await MongooseAppointmentModel.create(appointmentData);
    return deHydrate(doc);
  },

  async findAll(): Promise<Appointment[]> {
    const docs = await MongooseAppointmentModel.find().sort({ createdAt: -1 }).lean();
    return docs.map(doc => deHydrate(doc));
  },

  async findById(id: string): Promise<Appointment | undefined> {
    const doc = await MongooseAppointmentModel.findOne({ id }).lean();
    return doc ? deHydrate(doc) : undefined;
  },

  async findByUserId(userId: string): Promise<Appointment[]> {
    const docs = await MongooseAppointmentModel.find({ userId }).sort({ createdAt: -1 }).lean();
    return docs.map(doc => deHydrate(doc));
  },

  /**
   * ◄ ADDED: fetches all non-cancelled appointments for a given business on a
   * given day. Used by createAppointment's overlap check — this is the query
   * that answers "is anything already booked in this business's calendar today".
   */
  async findByBusinessAndDate(businessId: string, date: string): Promise<Appointment[]> {
    const docs = await MongooseAppointmentModel
      .find({ businessId, date, status: { $ne: "cancelled" } })
      .lean();
    return docs.map(doc => deHydrate(doc));
  },

  async update(
    id: string,
    changes: UpdateAppointmentRequest
  ): Promise<Appointment | undefined> {
    // Keep `service` (display string) and `durationMinutes` in sync if the
    // caller updates `services` directly (e.g. future reschedule-with-different-services flow).
    const patch: Record<string, any> = { ...changes };
    if (Array.isArray(changes.services) && changes.services.length > 0) {
      const cleanServices = changes.services.map((s) => s.trim()).filter(Boolean);
      patch.services = cleanServices;
      patch.service = cleanServices.join(" + ");
      patch.durationMinutes = cleanServices.length * SLOT_MINUTES;
    }

    const doc = await MongooseAppointmentModel.findOneAndUpdate(
      { id },
      { $set: patch },
      { new: true }
    );
    return doc ? deHydrate(doc) : undefined;
  },

  async cancel(id: string): Promise<Appointment | undefined> {
    return this.update(id, { status: "cancelled" });
  },

  async delete(id: string): Promise<boolean> {
    const result = await MongooseAppointmentModel.deleteOne({ id });
    return result.deletedCount > 0;
  },

  async clearAll(): Promise<void> {
    await MongooseAppointmentModel.deleteMany({});
  },
};