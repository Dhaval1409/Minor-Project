// /**
//  * FILENAME: src/routes/appointmentRoutes.ts
//  * 
//  * REST API Endpoints routing maps for appointments and multi-tenant business registrations.
//  * Connecting HTTP request methods to functions in appointmentController.ts and botManager.ts
//  */

// import { Router, Request, Response } from "express";
// import { 
//   getAllAppointments, 
//   createAppointment, 
//   getAppointmentById, 
//   deleteAppointment 
// } from "../controllers/appointmentController";
// import { BusinessModel } from "../models/businessModel";
// import { startIndividualShopBot } from "../config/botManager";

// const router = Router();

// // ===========================================================================
// // SaaS Multi-Tenant Business Onboarding Route
// // ===========================================================================

// /**
//  * ROUTE: POST http://localhost:5000/appointments/business/register
//  * DESCRIPTION: Triggered when a new business completes the onboarding flow screen.
//  * Saves configuration parameters and dynamically initiates their AI bot.
//  */
// router.post("/business/register", async (req: Request, res: Response): Promise<void> => {
//   try {
//     const { name, businessType, city, opens, closes, servicesProvided, telegramBotToken } = req.body;

//     // Validation guard checks
//     if (!name || !businessType) {
//       res.status(400).json({ success: false, message: "Business Name and Type are required." });
//       return;
//     }

//     // Standardize input values into the backend database model
//     const newBusiness = await BusinessModel.create({
//       name,
//       businessType,
//       city,
//       hours: { opens, closes },
//       servicesProvided: typeof servicesProvided === "string" 
//         ? servicesProvided.split(",").map((s: string) => s.trim()) 
//         : servicesProvided,
//       telegramBotToken
//     });

//     // Spin up the distinct AI listener for this specific bot instantly without rebooting
//     if (telegramBotToken) {
//       startIndividualShopBot(newBusiness);
//     }

//     res.status(201).json({
//       success: true,
//       message: `Successfully registered "${name}"! Their dedicated Aria worker is now active.`,
//       businessId: newBusiness._id
//     });
//   } catch (error: any) {
//     console.error("❌ Business Registration Error:", error);
//     res.status(500).json({ 
//       success: false, 
//       // message: "Server error creating business account layer.", 
//       error: error.message 
//     });
//   }
// });

// // ===========================================================================
// // Core Appointment Endpoints
// // ===========================================================================

// // 1. Get all appointments (GET http://localhost:5000/appointments)
// router.get("/", getAllAppointments);

// // 2. Book a new appointment (POST http://localhost:5000/appointments)
// router.post("/", createAppointment);

// // 3. Get specific appointment by ID (GET http://localhost:5000/appointments/:id)
// router.get("/:id", getAppointmentById);

// // 4. Cancel / Delete an appointment (DELETE http://localhost:5000/appointments/:id)
// router.delete("/:id", deleteAppointment);

// export default router;


/**
 * FILENAME: src/routes/appointmentRoutes.ts
 * 
 * REST API Endpoints routing maps for appointments.
 * Connecting HTTP request methods to functions in appointmentController.ts
 */

import { Router } from "express";
import { 
  getAllAppointments, 
  createAppointment, 
  getAppointmentById, 
  deleteAppointment 
} from "../controllers/appointmentController";

const router = Router();

// ===========================================================================
// Core Appointment Endpoints
// ===========================================================================

// 1. Get all appointments (GET http://localhost:5000/appointments)
router.get("/", getAllAppointments);

// 2. Book a new appointment (POST http://localhost:5000/appointments)
router.post("/", createAppointment);

// 3. Get specific appointment by ID (GET http://localhost:5000/appointments/:id)
router.get("/:id", getAppointmentById);

// 4. Cancel / Delete an appointment (DELETE http://localhost:5000/appointments/:id)
router.delete("/:id", deleteAppointment);

export default router;