/**
 * FILENAME: src/models/businessModel.ts
 */
import { Schema, model, Document } from "mongoose";
import { v4 as uuidv4 } from "uuid";

// ◄ ADDED: richer service entry (name + price + optional duration + active flag).
// Kept separate from the legacy `servicesProvided: string[]` field below so
// any existing AI/bot code reading `servicesProvided` keeps working untouched.
export interface IServiceItem {
  id: string;
  name: string;
  price: number;
  duration?: string;
  active: boolean;
}

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
  services: IServiceItem[]; // ◄ ADDED: full service catalog (name/price/duration/active)
  telegramBotToken?: string;
  phone?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ServiceItemSchema = new Schema<IServiceItem>(
  {
    id: { type: String, default: () => uuidv4() },
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    duration: { type: String, trim: true, default: "" },
    active: { type: Boolean, default: true },
  },
  { _id: false }
);

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
  services: {
    type: [ServiceItemSchema], // ◄ ADDED
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