/**
 * FILENAME: src/controllers/appointmentController.ts
 */
import { Request, Response } from 'express';
import { AppointmentModel } from '../models/appointmentModel';
import { BusinessModel } from '../models/businessModel';

// Handles GET /appointments
export const getAllAppointments = async (req: Request, res: Response) => {
  try {
    const appointments = await AppointmentModel.findAll();

    return res.status(200).json({
      success: true,
      data: appointments,
    });
  } catch (error: any) {
    console.error('❌ Error fetching appointments:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error fetching appointments',
    });
  }
};

// Handles GET /appointments/:id
export const getAppointmentById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const appointment = await AppointmentModel.findById(id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment record not found.',
      });
    }

    return res.status(200).json({
      success: true,
      data: appointment,
    });
  } catch (error: any) {
    console.error('❌ Error fetching appointment:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error fetching appointment',
    });
  }
};

// Handles POST /appointments
export const createAppointment = async (req: Request, res: Response) => {
  try {
    const savedAppointment = await AppointmentModel.create(req.body);

    return res.status(201).json({
      success: true,
      data: savedAppointment,
    });
  } catch (error: any) {
    console.error('❌ Error creating appointment:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error creating appointment',
    });
  }
};

// Handles DELETE /appointments/:id (triggered from dashboard cancel button)
export const deleteAppointment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // 1. Find appointment details to get telegramChatId and businessId
    const appointment = await AppointmentModel.findById(id);

    if (!appointment) {
      return res.status(404).json({ 
        success: false, 
        message: 'Appointment record not found.' 
      });
    }

    // 2. Dispatch Telegram notification using native fetch if telegramChatId exists
    if (appointment.businessId) {
      try {
        const business = await BusinessModel.findById(appointment.businessId);

        if (business && business.telegramBotToken) {
          const messageText = `⚠️ Hello ${appointment.name},\n\nYour appointment for *${appointment.service}* scheduled on *${appointment.date}* at *${appointment.time}* has been *cancelled* by the business dashboard.\n\nFeel free to chat with me anytime to book a new slot!`;

          const telegramUrl = `https://api.telegram.org/bot${business.telegramBotToken}/sendMessage`;
          
          await fetch(telegramUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: (appointment as any).telegramChatId || (appointment as any).userId,
              text: messageText,
              parse_mode: 'Markdown',
            }),
          });

          console.log(`✉️ Telegram cancellation notice sent successfully.`);
        }
      } catch (tgError) {
        console.error('⚠️ Failed to dispatch Telegram cancellation notification:', tgError);
      }
    }

    // 3. Delete from DB via AppointmentModel wrapper
    await AppointmentModel.delete(id);

    return res.status(200).json({ 
      success: true, 
      message: 'Appointment deleted successfully and user notified via Telegram.' 
    });

  } catch (error: any) {
    console.error('❌ Error deleting appointment:', error);
    return res.status(500).json({ 
      success: false, 
      message: error.message || 'Internal server error during deletion.' 
    });
  }
};