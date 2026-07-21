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
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { initializeAllSaaS_Bots } from "./config/botManager";

// Force IPv4 resolution order to avoid connection delays with local setups
dns.setDefaultResultOrder('ipv4first');

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 5000;

// Global middleware configurations
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serverless Middleware: Ensure DB is connected before processing any incoming route
app.use(async (req: Request, res: Response, next: NextFunction) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error("❌ Failed to connect to DB inside middleware:", error);
    res.status(500).json({ success: false, message: "Database connection failed." });
  }
});

// Root Verification Endpoint (Fixes 404 on base URL)
app.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "Aria SaaS Multi-Tenant API is live!",
    endpoints: {
      health: "/health",
      appointments: "/appointments",
      business: "/business"
    }
  });
});

// Server Health Verification Endpoint
app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({ success: true, message: "Aria SaaS multi-tenant backend is running safely." });
});

// REST API Router Mounts
app.use("/appointments", appointmentRoutes); 
app.use("/business", businessRoutes);       

// Centralized System Error Interceptors
app.use(notFoundHandler);
app.use(errorHandler);

// Establish local standalone HTTP listener (Only runs when executing directly via Node / Nodemon)
if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, async () => {
    console.log(`🚀 Aria SaaS backend listening on http://localhost:${PORT}`);
    
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