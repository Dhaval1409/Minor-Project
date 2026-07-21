/**
 * FILENAME: src/models/appointmentModel.ts
 *
 * Type definitions + Mongoose persistent database layer for appointments.
 * Refactored to use MongoDB via Mongoose, maintaining exact method signatures 
 * so that controllers do not break.
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
  service: string;
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
  service: string;
  date: string;
  time: string;
}

/** Shape of the payload used to update/reschedule an appointment. */
export interface UpdateAppointmentRequest {
  name?: string;
  phone?: string;
  businessType?: string;
  service?: string;
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
  service: string;
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
    service: { type: String, required: true },
    date: { type: String, required: true },
    time: { type: String, required: true },
    status: { type: String, enum: APPOINTMENT_STATUSES, default: "pending" },
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

export const AppointmentModel = {
  async create(data: BookingRequest): Promise<Appointment> {
    const appointmentData = {
      id: uuidv4(),
      businessId: data.businessId ?? "",
      userId: data.userId ?? uuidv4(),
      name: data.name,
      phone: data.phone,
      businessType: data.businessType,
      service: data.service,
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

  async update(
    id: string,
    changes: UpdateAppointmentRequest
  ): Promise<Appointment | undefined> {
    const doc = await MongooseAppointmentModel.findOneAndUpdate(
      { id },
      { $set: changes },
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