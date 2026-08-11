/**
 * FILENAME: src/index.ts
 *
 * Express server bootstrap + Database connection + SaaS Multi-Tenant Bot startup.
 * Fully compatible with MERN Stack / Next.js & Vercel Serverless deployments.
 */
import dns from 'dns';
import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import { connectDB } from "./config/db";
import appointmentRoutes from "./routes/appointmentRoutes";
import businessRoutes from "./routes/businessRoutes";
import authRoutes from "./routes/authRoutes";
import adminRoutes from "./routes/adminRoutes"; // <-- ADDED: Import admin routes
import leadRoutes from "./routes/leadRoutes"
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { initializeAllSaaS_Bots } from "./config/botManager";


// Force IPv4 resolution order to avoid connection delays with local setups
dns.setDefaultResultOrder('ipv4first');

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 5000;

// 1. Permissive CORS Setup (Prevents preflight blocks across preview & production deployments)
app.use(
  cors({
    origin: true, // Automatically mirrors the incoming origin (allows localhost & any vercel domain)
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    credentials: true,
  })
);

// Respond instantly to all HTTP OPTIONS preflight requests before touching DB
app.options("*", cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 2. Serverless Middleware: Ensure DB is connected before processing operational API requests
app.use(async (req: Request, res: Response, next: NextFunction) => {
  // Skip DB connection check for preflight or root/health routes
  if (req.method === "OPTIONS" || req.path === "/" || req.path === "/health") {
    return next();
  }

  try {
    await connectDB();
    next();
  } catch (error) {
    console.error("❌ Failed to connect to DB inside middleware:", error);
    res.status(500).json({ success: false, message: "Database connection failed." });
  }
});

// Root Verification Endpoint
app.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "Aria SaaS Multi-Tenant API is live!",
    endpoints: {
      health: "/health",
      appointments: "/appointments",
      business: "/business",
      admin: "/admin" // <-- ADDED: Reference in root endpoint
    }
  });
});

// Server Health Verification Endpoint
app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({ success: true, message: "Aria SaaS multi-tenant backend is running safely." });
});

// REST API Router Mounts
app.use("/auth", authRoutes);
app.use("/appointments", appointmentRoutes);
app.use("/business", businessRoutes);
app.use("/admin", adminRoutes); // <-- ADDED: Mount the admin routes
app.use("/leads", leadRoutes); // <-- ADDED: Mount the lead routes

// Centralized System Error Interceptors
app.use(notFoundHandler);
app.use(errorHandler);

// Establish local standalone HTTP listener (Only runs when executing directly via Node / Nodemon)
if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, async () => {
    console.log(`🚀 Aria SaaS backend listening on http://localhost:${PORT}`);

    // FIX: explicitly connect to MongoDB before touching any collections.
    // Previously, initializeAllSaaS_Bots() ran here directly and called
    // BusinessModel.find() without the DB ever being connected — the
    // per-request middleware below is what normally triggers connectDB(),
    // but bot startup happens outside the request/response cycle, so it
    // never ran. That's what caused the 10s "buffering timed out" crash.
    try {
      await connectDB();
      console.log("✅ MongoDB connected — proceeding to bot startup.");
    } catch (dbError) {
      console.error("❌ Failed to connect to MongoDB at startup. Bots will NOT be initialized:", dbError);
      return; // Don't attempt bot startup against a dead connection
    }

    try {
      await initializeAllSaaS_Bots();
      console.log("🤖 All active customer shop bots have been deployed successfully.");
    } catch (botError) {
      console.error("❌ Failed to initialize multi-tenant SaaS Bot manager:", botError);
    }
  });
}

// CRITICAL: Export app for Vercel Serverless Function engine
export default app;