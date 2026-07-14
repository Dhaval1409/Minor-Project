/**
 * FILENAME: src/index.ts
 *
 * Express server bootstrap + Database connection + SaaS Multi-Tenant Bot startup.
 */
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['8.8.8.8', '8.8.4.4']);

import "dotenv/config";
import express, { Request, Response } from "express";
import cors from "cors";
import { connectDB } from "./config/db";
import appointmentRoutes from "./routes/appointmentRoutes";
import businessRoutes from "./routes/businessRoutes";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { initializeAllSaaS_Bots } from "./config/botManager"; // ◄ Added SaaS Bot Manager


const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 5000;

// Global middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({ success: true, message: "Aria SaaS multi-tenant backend is running safely." });
});

// REST API routes
app.use("/appointments", appointmentRoutes);
app.use("/appointments", appointmentRoutes);
app.use("/business", businessRoutes); //

// Error handlers
app.use(notFoundHandler);
app.use(errorHandler);

// Connect to Database first, then spin up the server listeners
async function startServer() {
  try {
    // 1. Establish database connection before accepting traffic
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
    process.exit(1); // Exit process with failure code
  }
}

startServer();