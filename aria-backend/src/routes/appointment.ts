/**
 * src/routes/appointment.ts
 *
 * REST API Endpoints routing maps for appointments.
 */

import { Router } from "express";
import { 
  getAllAppointments, 
  createAppointment, 
  getAppointmentById, 
  deleteAppointment 
} from "../controllers/appointmentController";

const router = Router();

// 1. Get all appointments (GET http://localhost:5000/appointments)
router.get("/", getAllAppointments);

// 2. Book a new appointment (POST http://localhost:5000/appointments)
router.post("/", createAppointment);

// 3. Get specific appointment by ID (GET http://localhost:5000/appointments/:id)
router.get("/:id", getAppointmentById);

// 4. Cancel / Delete an appointment (DELETE http://localhost:5000/appointments/:id)
router.delete("/:id", deleteAppointment);

export default router;