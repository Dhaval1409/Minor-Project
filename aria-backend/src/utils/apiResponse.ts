/**
 * utils/apiResponse.ts
 *
 * Small helpers to keep every API response shape consistent:
 *   { success: boolean, message?: string, data?: T }
 */

import { Response } from "express";

export interface ApiSuccess<T> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiFailure {
  success: false;
  message: string;
}

export function sendSuccess<T>(
  res: Response,
  data: T,
  message?: string,
  statusCode = 200
): Response {
  const body: ApiSuccess<T> = { success: true, data, message };
  return res.status(statusCode).json(body);
}

export function sendError(
  res: Response,
  message: string,
  statusCode = 400
): Response {
  const body: ApiFailure = { success: false, message };
  return res.status(statusCode).json(body);
}
