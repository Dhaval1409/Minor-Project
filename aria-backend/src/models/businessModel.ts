/**
 * FILENAME: src/models/businessModel.ts
 */
import { Schema, model, Document } from "mongoose";

export interface IBusiness extends Document {
  name: string;          // Business/shop name (e.g. "AriaCare")
  ownerName?: string;    // Admin's personal full name (e.g. "Rina Deshmukh")
  email: string;
  password: string;
  businessType: string;
  city?: string;
  hours: {
    opens: string;
    closes: string;
  };
  servicesProvided: string[];
  telegramBotToken?: string;
  phone?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BusinessSchema = new Schema<IBusiness>({
  name: {
    type: String,
    required: [true, 'Business name is required'],
    trim: true
  },
  ownerName: {
    type: String,
    trim: true,
    default: ''
  },
  email: {
    type: String,
    required: [true, 'Authentication email is required'],
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: [true, 'Secure password is required'],
    minlength: 6
  },
  businessType: {
    type: String,
    required: [true, 'Business type is required'],
    trim: true
  },
  city: {
    type: String,
    trim: true
  },
  hours: {
    opens: { type: String, default: "10:00 AM" },
    closes: { type: String, default: "08:00 PM" }
  },
  servicesProvided: {
    type: [String],
    default: []
  },
  telegramBotToken: {
    type: String,
    unique: true,
    sparse: true
  },
  phone: {
    type: String,
    trim: true,
    default: ''
  }
}, {
  timestamps: true
});

export const BusinessModel = model<IBusiness>("Business", BusinessSchema);
export default BusinessModel;