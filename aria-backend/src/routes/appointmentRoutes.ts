/**
 * FILENAME: src/routes/appointmentRoutes.ts
 * 
 * REST API Endpoints routing maps for appointments and multi-tenant business registrations.
 */

import { Router, Request, Response } from "express";
import mongoose from "mongoose"; 
import jwt from "jsonwebtoken"; // ◄ Added for generating immediate session tokens
import { protectTenant, AuthenticatedRequest } from "../middleware/authMiddleware";
import { 
  getAllAppointments, 
  createAppointment, 
  getAppointmentById, 
  deleteAppointment 
} from "../controllers/appointmentController";
import BusinessModel from "../models/businessModel";
import { startIndividualShopBot } from "../config/botManager";

const router = Router();

// ===========================================================================
// SaaS Multi-Tenant Business Onboarding Route
// ===========================================================================

/**
 * ROUTE: POST http://localhost:5000/appointments/business/register
 * DESCRIPTION: Triggered when a new business completes the onboarding flow screen.
 */
router.post("/business/register", async (req: Request, res: Response): Promise<void> => {
  try {
    // Extracted core authentication credentials along with metadata from request payload
    const { 
      name, 
      email, 
      password, 
      phone, 
      businessType, 
      city, 
      opens, 
      closes, 
      servicesProvided, 
      telegramBotToken 
    } = req.body;

    // Strict validation guard ensuring mandatory database fields are populated
    if (!name || !businessType || !email || !password) {
      res.status(400).json({ 
        success: false, 
        message: "Business Name, Industry Type, Corporate Email, and Secure Password are required." 
      });
      return;
    }

    // Check for pre-existing corporate email registry to prevent schema collision errors
    const trackingDuplicate = await BusinessModel.findOne({ email });
    if (trackingDuplicate) {
      res.status(400).json({ 
        success: false, 
        message: "This corporate email address is already registered to an active profile." 
      });
      return;
    }

    // Standardize input values into the backend database model cleanly
    const newBusiness = await BusinessModel.create({
      name,
      email,            
      password,         // Passed securely down to schema level
      phone: phone || "", 
      businessType,
      city: city || "",
      hours: { 
        opens: opens || "10:00 AM", 
        closes: closes || "08:00 PM" 
      },
      servicesProvided: typeof servicesProvided === "string" 
        ? servicesProvided.split(",").map((s: string) => s.trim()) 
        : servicesProvided || [],
      telegramBotToken
    });

    // Spin up the distinct AI listener for this specific bot instantly without rebooting
    if (telegramBotToken) {
      startIndividualShopBot(newBusiness);
    }

    // 🔴 FIX: Generate session token matching your protectTenant payload schema structure
    const token = jwt.sign(
      { id: newBusiness._id, email: newBusiness.email },
      process.env.JWT_SECRET || "fallback_secret_key",
      { expiresIn: "7d" }
    );

    // Returning success confirmation and payload signature to match frontend state keys
    res.status(201).json({
      success: true,
      message: `Successfully registered "${name}"! Their dedicated Aria worker is now active.`,
      token, // ◄ Returned to frontend for automated dashboard authorization bypass
      businessId: newBusiness._id,
      business: {
        id: newBusiness._id,
        name: newBusiness.name,
        email: newBusiness.email
      }
    });
  } catch (error: any) {
    console.error("❌ Business Registration Error:", error);
    res.status(500).json({ 
      success: false, 
      error: error.message || "Server error creating business account layer."
    });
  }
});

// ===========================================================================
// Tenant Isolation Dashboard Endpoint
// ===========================================================================

/**
 * ROUTE: GET http://localhost:5000/appointments/tenant/dashboard
 * DESCRIPTION: Securely loads appointments mapped strictly to the logged-in business profile.
 */
router.get("/tenant/dashboard", protectTenant, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const tenantBusinessId = req.business?.id;

    if (!tenantBusinessId) {
      res.status(400).json({ success: false, message: "Tenant identification missing from session context." });
      return;
    }

    // Safely look up the registered 'Appointment' model out of Mongoose's active register
    const Appointment = mongoose.model("Appointment");
    
    // Database query isolated exclusively to this tenant's unique database ID
    const tenantBookings = await Appointment.find({ businessId: tenantBusinessId }).sort({ date: 1, time: 1 });
    
    res.status(200).json({
      success: true,
      count: tenantBookings.length,
      appointments: tenantBookings
    });
  } catch (error: any) {
    console.error("❌ Tenant Dashboard Read Error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Server error encountered while pulling isolated workspace data streams." 
    });
  }
});

// ===========================================================================
// Core Appointment Endpoints
// ===========================================================================

// 1. Get all system appointments (GET http://localhost:5000/appointments)
router.get("/", getAllAppointments);

// 2. Book a new appointment (POST http://localhost:5000/appointments)
router.post("/", createAppointment);

// 3. Get specific appointment by ID (GET http://localhost:5000/appointments/:id)
router.get("/:id", getAppointmentById);

// 4. Cancel / Delete an appointment (DELETE http://localhost:5000/appointments/:id)
router.delete("/:id", deleteAppointment);

export default router;