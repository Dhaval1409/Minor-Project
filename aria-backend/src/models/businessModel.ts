/**
 * FILENAME: src/models/businessModel.ts
 */

import { Schema, model, Document } from "mongoose";
import { v4 as uuidv4 } from "uuid";

export interface IServiceItem {
  id: string;
  name: string;
  price: number;
  duration?: string;
  active: boolean;
}

export interface IBusiness extends Document {
  name: string;
  ownerName?: string;
  email: string;
  password: string;
  businessType: string;
  city?: string;

  hours: {
    opens: string;
    closes: string;
  };

  servicesProvided: string[];
  services: IServiceItem[];

  telegramBotToken?: string;
  telegramBotLink?: string;
  phone?: string;

  // Multiple business gallery images
  galleryImages: string[];

  description?: string;
  contactEmail?: string;
  image?: string;
  logo?: string;

  rating: number;
  reviewCount: number;
  featured: boolean;
  verified: boolean;

  createdAt: Date;
  updatedAt: Date;
}

const ServiceItemSchema = new Schema<IServiceItem>(
  {
    id: {
      type: String,
      default: () => uuidv4(),
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    duration: {
      type: String,
      trim: true,
      default: "",
    },

    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    _id: false,
  }
);

const BusinessSchema = new Schema<IBusiness>(
  {
    name: {
      type: String,
      required: [true, "Business name is required"],
      trim: true,
    },

    ownerName: {
      type: String,
      trim: true,
      default: "",
    },

    email: {
      type: String,
      required: [true, "Authentication email is required"],
      unique: true,
      trim: true,
      lowercase: true,
    },

    password: {
      type: String,
      required: [true, "Secure password is required"],
      minlength: 6,
    },

    businessType: {
      type: String,
      required: [true, "Business type is required"],
      trim: true,
    },

    city: {
      type: String,
      trim: true,
    },

    hours: {
      opens: {
        type: String,
        default: "10:00 AM",
      },
      closes: {
        type: String,
        default: "08:00 PM",
      },
    },

    servicesProvided: {
      type: [String],
      default: [],
    },

    services: {
      type: [ServiceItemSchema],
      default: [],
    },

    telegramBotToken: {
      type: String,
      unique: true,
      sparse: true,
    },

    // Public-facing link customers tap on the business profile page to
    // open a chat with the business's Telegram bot (e.g. https://t.me/your_bot)
    telegramBotLink: {
      type: String,
      trim: true,
      default: "",
    },

    phone: {
      type: String,
      trim: true,
      default: "",
    },

    // ==========================================
    // BUSINESS GALLERY IMAGES
    // ==========================================
    galleryImages: {
      type: [String],
      default: [],
    },

    description: {
      type: String,
      trim: true,
      default: "",
    },

    contactEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },

    image: {
      type: String,
      trim: true,
      default: "",
    },

    logo: {
      type: String,
      trim: true,
      default: "",
    },

    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },

    reviewCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    featured: {
      type: Boolean,
      default: false,
    },

    verified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export const BusinessModel = model<IBusiness>(
  "Business",
  BusinessSchema
);

export default BusinessModel;