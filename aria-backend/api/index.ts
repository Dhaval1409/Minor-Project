import "dotenv/config";
import express, { Request, Response } from "express";
import cors from "cors";
import { connectDB } from "../src/config/db";
import appointmentRoutes from "../src/routes/appointmentRoutes";
import businessRoutes from "../src/routes/businessRoutes";
import { errorHandler, notFoundHandler } from "../src/middleware/errorHandler";

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure DB is connected on every invocation
app.use(async (req, res, next) => {
  await connectDB();
  next();
});

app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({ success: true, message: "Aria backend is live on Vercel serverless!" });
});

app.use("/appointments", appointmentRoutes);
app.use("/business", businessRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;