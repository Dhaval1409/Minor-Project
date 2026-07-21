/**
 * FILENAME: src/index.ts
 *
 * Express server bootstrap + Database connection + SaaS Multi-Tenant Bot startup.
 * Fully compatible with MERN Stack / Next.js architecture.
 */
import dns from 'dns';

// Force IPv4 resolution order to avoid connection delays with local setups
dns.setDefaultResultOrder('ipv4first');

// Note: Disabled hardcoded Google DNS override as it causes ECONNREFUSED with MongoDB Atlas SRV URIs
// dns.setServers(['8.8.8.8', '8.8.4.4']);

import "dotenv/config";
import express, { Request, Response } from "express";
import cors from "cors";
import { connectDB } from "./config/db";
import appointmentRoutes from "./routes/appointmentRoutes";
import businessRoutes from "./routes/businessRoutes";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { initializeAllSaaS_Bots } from "./config/botManager";

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 5000;

// Global middleware configurations
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
// Handles core appointment processes and setup flows
app.use("/appointments", appointmentRoutes); 

// Handles direct Profile CRUD operational data flow matching the frontend custom hooks
app.use("/business", businessRoutes);       

// Centralized System Error Interceptors
app.use(notFoundHandler);
app.use(errorHandler);

// Establish secure infrastructure pipes sequentially
async function startServer() {
  try {
    // 1. Establish database connection before accepting network traffic
    await connectDB();
    
    // 2. Start listening on the designated network port
    app.listen(PORT, async () => {
      console.log(`🚀 Aria SaaS backend listening on http://localhost:${PORT}`);
      
      // 3. Fire up the dynamic multi-tenant polling loops safely
      try {
        await initializeAllSaaS_Bots();
        console.log("🤖 All active customer shop bots have been deployed successfully.");
      } catch (botError) {
        console.error("❌ Failed to initialize multi-tenant SaaS Bot manager:", botError);
      }
    });
  } catch (dbError) {
    console.error("❌ Critical System Failure: Could not start Aria Backend Server.");
    console.error(dbError);
    process.exit(1); // Exit process instantly with failure code
  }
}

startServer();