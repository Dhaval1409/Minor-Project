/**
 * FILENAME: src/routes/authRoutes.ts
 */
import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import BusinessModel from "../models/businessModel";
import { startIndividualShopBot } from "../config/botManager";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_key";

// REGISTER NEW TENANT
router.post("/register", async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, businessType, city, telegramBotToken, phone } = req.body;

    const existingBusiness = await BusinessModel.findOne({ email });
    if (existingBusiness) {
      res.status(400).json({ success: false, message: "An account with this email already exists." });
      return;
    }

    // Hash the raw text password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newBusiness = await BusinessModel.create({
      name,
      email,
      password: hashedPassword,
      businessType,
      city,
      phone,
      telegramBotToken
    });

    if (telegramBotToken) {
      startIndividualShopBot(newBusiness);
    }

    const token = jwt.sign({ id: newBusiness._id, email: newBusiness.email }, JWT_SECRET, { expiresIn: "7d" });

    res.status(201).json({
      success: true,
      token,
      business: { id: newBusiness._id, name: newBusiness.name, email: newBusiness.email }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// LOGIN TENANT
router.post("/login", async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    const business = await BusinessModel.findOne({ email });
    if (!business) {
      res.status(400).json({ success: false, message: "Invalid email or credentials." });
      return;
    }

    const isMatch = await bcrypt.compare(password, business.password);
    if (!isMatch) {
      res.status(400).json({ success: false, message: "Invalid password credentials." });
      return;
    }

    const token = jwt.sign({ id: business._id, email: business.email }, JWT_SECRET, { expiresIn: "7d" });

    res.status(200).json({
      success: true,
      token,
      business: { id: business._id, name: business.name, email: business.email }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;