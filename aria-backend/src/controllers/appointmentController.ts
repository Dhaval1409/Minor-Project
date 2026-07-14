/**
 * FILENAME: src/controllers/appointmentController.ts
 * 
 * Handles incoming REST API HTTP requests for appointment bookings, 
 * listings, and cancellations, forwarding the operations to AppointmentModel.
 */

import { Request, Response, NextFunction } from "express";
import { AppointmentModel } from "../models/appointmentModel";

// 1. Get all appointments
export const getAllAppointments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const list = await AppointmentModel.findAll();
    res.status(200).json({ success: true, data: list });
  } catch (err) {
    next(err);
  }
};

// 2. Book an appointment
export const createAppointment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const newRecord = await AppointmentModel.create(req.body);
    res.status(201).json({ 
      success: true, 
      data: newRecord, 
      message: "Appointment booked successfully." 
    });
  } catch (err) {
    next(err);
  }
};

// 3. Get single appointment details
export const getAppointmentById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const record = await AppointmentModel.findById(req.params.id);
    if (!record) {
      return res.status(404).json({ success: false, message: "Appointment not found." });
    }
    res.status(200).json({ success: true, data: record });
  } catch (err) {
    next(err);
  }
};

// 4. Delete / Cancel appointment
export const deleteAppointment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const success = await AppointmentModel.delete(req.params.id);
    if (!success) {
      return res.status(404).json({ success: false, message: "Appointment not found." });
    }
    res.status(200).json({ success: true, message: "Appointment cancelled successfully." });
  } catch (err) {
    next(err);
  }
};