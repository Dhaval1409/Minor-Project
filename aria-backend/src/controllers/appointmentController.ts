/**
 * FILENAME: src/controllers/appointmentController.ts
 */
import { Request, Response } from 'express';
import { AppointmentModel, SLOT_MINUTES } from '../models/appointmentModel';
import { BusinessModel } from '../models/businessModel';
import {
  generateDaySlots,
  formatSlotsForChat,
  parseTimeToMinutes,
  computeDurationMinutes,
  hasBookingOverlap,
} from '../utils/slotGenerator';

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
    const { businessId, date, time } = req.body;

    // Accept either the new `services: string[]` (multi-service booking) or
    // the legacy single `service: string` field — normalize to an array either way.
    const services: string[] = Array.isArray(req.body.services)
      ? req.body.services.map((s: string) => s.trim()).filter(Boolean)
      : req.body.service
        ? [String(req.body.service).trim()]
        : [];

    if (services.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one service must be selected to book an appointment.',
      });
    }

    if (!date || !time) {
      return res.status(400).json({
        success: false,
        message: 'Date and time are required to book an appointment.',
      });
    }

    // 30-min-per-service rule.
    const durationMinutes = computeDurationMinutes(services);
    const newStart = parseTimeToMinutes(time);
    const newEnd = newStart + durationMinutes;

    if (Number.isNaN(newStart)) {
      return res.status(400).json({
        success: false,
        message: `Couldn't understand the time "${time}". Please use a format like "15:00" or "3:00 PM".`,
      });
    }

    // Overlap check — scoped to this business + this day. Skipped only if no
    // businessId is present (can't determine whose calendar to check against).
    if (businessId) {
      const sameDayAppointments = await AppointmentModel.findByBusinessAndDate(businessId, date);

      if (hasBookingOverlap(sameDayAppointments, newStart, newEnd)) {
        return res.status(409).json({
          success: false,
          message: `That time slot isn't available — this booking needs ${durationMinutes} minutes (${services.length} × ${SLOT_MINUTES} min). Please choose a different time.`,
        });
      }
    }

    const savedAppointment = await AppointmentModel.create({
      ...req.body,
      services,
    });

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

/**
 * Shared helper: sends a Telegram message to the customer tied to an
 * appointment, if the business has a bot configured. Used by both the
 * cancel and complete flows so the message-sending logic lives in one place.
 */
async function notifyCustomer(appointment: any, messageText: string) {
  if (!appointment.businessId) return;

  try {
    const business = await BusinessModel.findById(appointment.businessId);

    if (business && business.telegramBotToken) {
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

      console.log(`✉️ Telegram notification sent successfully.`);
    }
  } catch (tgError) {
    console.error('⚠️ Failed to dispatch Telegram notification:', tgError);
  }
}

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

    // 2. Dispatch Telegram cancellation notice
    const business = appointment.businessId
      ? await BusinessModel.findById(appointment.businessId)
      : null;
    const shopName = business?.name || 'us';

    const cancelMessage = `⚠️ Hello ${appointment.name},\n\nYour appointment for *${appointment.service}* scheduled on *${appointment.date}* at *${appointment.time}* has been *cancelled* by the business dashboard.\n\nFeel free to chat with me anytime to book a new slot!`;
    await notifyCustomer(appointment, cancelMessage);

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

// Handles PATCH /appointments/:id/complete (triggered from dashboard "Complete" button/tap)
export const completeAppointment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // 1. Find appointment details first, same pattern as cancel
    const appointment = await AppointmentModel.findById(id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment record not found.'
      });
    }

    // 2. Mark as completed (record is kept, unlike cancel which deletes it)
    const updated = await AppointmentModel.update(id, { status: 'completed' });

    // 3. Look up business name so the thank-you message is personalized
    const business = appointment.businessId
      ? await BusinessModel.findById(appointment.businessId)
      : null;
    const shopName = business?.name || 'us';

    // 4. Dispatch Telegram thank-you notice
    const thankYouMessage = `🙏 Thank you, ${appointment.name}, for choosing *${shopName}*!\n\nYour appointment for *${appointment.service}* on *${appointment.date}* at *${appointment.time}* has been marked as *completed*.\n\nWe hope to see you again soon! 💚`;
    await notifyCustomer(appointment, thankYouMessage);

    return res.status(200).json({
      success: true,
      message: 'Appointment marked as completed and user thanked via Telegram.',
      data: updated,
    });

  } catch (error: any) {
    console.error('❌ Error completing appointment:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error during completion.'
    });
  }
};

// Handles GET /appointments/slots?businessId=...&date=YYYY-MM-DD
// Returns every slot for the day (booked + available) — used by the
// dashboard's "view schedule" view AND by Aria's chat bot when a customer
// asks something like "what slots are free today?"
export const getAvailableSlots = async (req: Request, res: Response) => {
  try {
    const { businessId, date } = req.query as { businessId?: string; date?: string };

    if (!businessId || !date) {
      return res.status(400).json({
        success: false,
        message: 'businessId and date are required, e.g. ?businessId=...&date=2026-08-06',
      });
    }

    const business = await BusinessModel.findById(businessId);
    if (!business) {
      return res.status(404).json({
        success: false,
        message: 'Business not found.',
      });
    }

    // Business hours live under `hours.opens` / `hours.closes` as 12hr
    // strings like "10:00 AM" / "08:00 PM" — matches businessModel.ts schema.
    const openTime = business.hours?.opens || '10:00 AM';
    const closeTime = business.hours?.closes || '08:00 PM';

    const dayAppointments = await AppointmentModel.findByBusinessAndDate(businessId, date);

    // Skip cancelled appointments if your model tags them with a status field.
    const activeAppointments = dayAppointments.filter((a: any) => a.status !== 'cancelled');

    const slots = generateDaySlots(openTime, closeTime, activeAppointments);
    const chatMessage = formatSlotsForChat(slots, date);

    return res.status(200).json({
      success: true,
      data: {
        date,
        businessId,
        slots,       // structured — for the dashboard UI
        chatMessage, // pre-formatted — Telegram bot can send this straight to the user
      },
    });
  } catch (error: any) {
    console.error('❌ Error generating available slots:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error generating available slots',
    });
  }
};