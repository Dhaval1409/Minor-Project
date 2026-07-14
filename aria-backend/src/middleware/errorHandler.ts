/**
 * middleware/errorHandler.ts
 *
 * Centralized error handling. Any error passed to next(err) anywhere in
 * the app (or thrown inside an asyncHandler-wrapped controller) ends up
 * here, and we always return the same JSON shape:
 *
 *   { success: false, message: string }
 */

import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError";

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
    return;
  }

  // Unexpected/programmer error — log full detail server-side, but don't
  // leak internals to the client.
  console.error("[Unhandled Error]", err);
  res.status(500).json({
    success: false,
    message: "Internal server error",
  });
}
