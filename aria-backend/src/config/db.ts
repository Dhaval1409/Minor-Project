/**
 * FILENAME: src/config/db.ts
 * Cached Mongoose Connection with DNS Override (Compatible with Local Dev & Vercel Serverless)
 */
import mongoose from "mongoose";
import dns from "dns";

// Interface for global cached connection
interface GlobalMongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongooseCache: GlobalMongooseCache;
}

// Initialize cache if not present
let cached = global.mongooseCache;
if (!cached) {
  cached = global.mongooseCache = { conn: null, promise: null };
}

export async function connectDB(): Promise<typeof mongoose> {
  // 1. Force Google DNS to bypass local Windows/ISP SRV lookup blocks
  dns.setServers(["8.8.8.8", "8.8.4.4"]);

  const connStr = process.env.MONGO_URI || process.env.MONGODB_URI;

  if (!connStr) {
    throw new Error("❌ MONGO_URI or MONGODB_URI is missing from environment variables.");
  }

  // 2. Return cached connection if already active (Crucial for Vercel Serverless)
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 10000,
      family: 4, // Force IPv4
    };

    cached.promise = mongoose.connect(connStr, opts).then((m) => m);
  }

  try {
    cached.conn = await cached.promise;
    console.log(`🍃 MongoDB Connected: ${cached.conn.connection.host}`);
  } catch (error) {
    cached.promise = null;
    console.error("❌ MongoDB connection error:", error);
    throw error;
  }

  return cached.conn;
}