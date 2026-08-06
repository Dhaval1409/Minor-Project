/**
 * FILENAME: src/utils/slotGenerator.ts
 *
 * Core slot-availability + overlap-checking engine. This is the SINGLE
 * SOURCE OF TRUTH for parsing times and detecting double-bookings — used by
 * BOTH the dashboard/REST booking flow (appointmentController.ts) AND the
 * Telegram bot booking flow (botManager.ts), so the two can never drift out
 * of sync again.
 */

import { SLOT_MINUTES } from '../models/appointmentModel';

export interface SlotAppointment {
  time: string; // "HH:MM" 24hr (or "3 PM" style — parseTimeToMinutes handles both)
  durationMinutes?: number;
}

export interface Slot {
  start: string;
  end: string;
  startLabel: string;
  endLabel: string;
  isBooked: boolean;
}

/**
 * Parses ANY reasonable time string into minutes since midnight. Handles:
 *   - 24hr:              "10:00", "20:00"
 *   - 12hr with minutes: "10:00 AM", "8:00 PM"
 *   - 12hr no minutes:   "3 PM", "12 PM"
 * Returns NaN only if the string is genuinely unparseable.
 */
export function parseTimeToMinutes(time: string): number {
  const trimmed = (time || '').trim();

  const ampmMatch = trimmed.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/i);
  if (ampmMatch) {
    let h = Number(ampmMatch[1]);
    const m = Number(ampmMatch[2] || 0);
    const period = ampmMatch[3].toUpperCase();
    if (period === 'PM' && h !== 12) h += 12;
    if (period === 'AM' && h === 12) h = 0;
    return h * 60 + m;
  }

  const parts = trimmed.split(':');
  if (parts.length === 2) {
    const h = Number(parts[0]);
    const m = Number(parts[1]);
    if (Number.isFinite(h) && Number.isFinite(m)) return h * 60 + m;
  }

  return NaN;
}

/** minutes since midnight -> "HH:MM" (24hr) */
function toTime24(mins: number): string {
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** "HH:MM" (24hr) -> "12:30 PM" (12hr, human-friendly) */
function toLabel(time24: string): string {
  const [hStr, mStr] = time24.split(':');
  let h = Number(hStr);
  const period = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${mStr} ${period}`;
}

/**
 * Rule: each service booked = one fixed 30-minute slot.
 * 1 service = 30 min, 2 services = 60 min, 3 services = 90 min, etc.
 */
export function computeDurationMinutes(services: string[]): number {
  return (services?.length || 1) * SLOT_MINUTES;
}

/**
 * Two bookings overlap if one starts before the other ends, in both
 * directions. `existing` is same-business, same-day, non-cancelled
 * appointments. NaN-safe: if either side's time failed to parse, that
 * comparison is skipped rather than silently returning "no overlap".
 */
export function hasBookingOverlap(
  existing: SlotAppointment[],
  newStart: number,
  newEnd: number
): boolean {
  if (Number.isNaN(newStart) || Number.isNaN(newEnd)) return false;

  return existing.some((a) => {
    const existStart = parseTimeToMinutes(a.time);
    if (Number.isNaN(existStart)) return false;
    const existEnd = existStart + (a.durationMinutes || SLOT_MINUTES);
    return existStart < newEnd && existEnd > newStart;
  });
}

/**
 * Generates every SLOT_MINUTES-sized slot between openTime and closeTime,
 * and marks each one booked/available based on the day's existing
 * appointments (respecting each appointment's own durationMinutes, so a
 * 60-min booking correctly blocks two consecutive 30-min slots).
 */
export function generateDaySlots(
  openTime: string,
  closeTime: string,
  appointments: SlotAppointment[]
): Slot[] {
  const openMins = parseTimeToMinutes(openTime);
  const closeMins = parseTimeToMinutes(closeTime);

  const bookedRanges = appointments.map((a) => {
    const start = parseTimeToMinutes(a.time);
    const end = start + (a.durationMinutes || SLOT_MINUTES);
    return { start, end };
  });

  const slots: Slot[] = [];

  for (let start = openMins; start + SLOT_MINUTES <= closeMins; start += SLOT_MINUTES) {
    const end = start + SLOT_MINUTES;
    const isBooked = bookedRanges.some((r) => !Number.isNaN(r.start) && r.start < end && r.end > start);

    const startTime = toTime24(start);
    const endTime = toTime24(end);

    slots.push({
      start: startTime,
      end: endTime,
      startLabel: toLabel(startTime),
      endLabel: toLabel(endTime),
      isBooked,
    });
  }

  return slots;
}

/**
 * Turns a slot list into a ready-to-send chat message, formatted as an
 * aligned table inside a Markdown code block (Telegram renders code blocks
 * in a monospace font, so columns actually line up — a raw "| a | b |"
 * Markdown table does NOT render as a table in Telegram, it just shows the
 * pipe characters literally).
 */
export function formatSlotsForChat(slots: Slot[], dateLabel: string): string {
  if (slots.length === 0) {
    return `Sorry, there are no bookable slots configured for *${dateLabel}*.`;
  }

  const timeColWidth = Math.max(
    ...slots.map((s) => `${s.startLabel} - ${s.endLabel}`.length),
    10
  );

  const rows = slots.map((s) => {
    const range = `${s.startLabel} - ${s.endLabel}`.padEnd(timeColWidth, ' ');
    const status = s.isBooked ? 'Booked' : 'Available';
    return `${range} | ${status}`;
  });

  const header = `${'Time Slot'.padEnd(timeColWidth, ' ')} | Status`;
  const divider = `${'-'.repeat(timeColWidth)} | --------`;

  const table = [header, divider, ...rows].join('\n');

  return `📅 *Slot availability for ${dateLabel}:*\n\n\`\`\`\n${table}\n\`\`\``;
}