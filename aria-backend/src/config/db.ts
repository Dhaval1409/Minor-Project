import mongoose from "mongoose";

export async function connectDB(): Promise<void> {
  try {
    const connStr = process.env.MONGO_URI;
    if (!connStr) {
      throw new Error("MONGO_URI is missing from your environment variables.");
    }

    const conn = await mongoose.connect(connStr);
    console.log(`🍃 MongoDB Connected successfully: ${conn.connection.host}`);
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1); // Crash the app safely if database fails to connect
  }
}