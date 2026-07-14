/**
 * utils/AppError.ts
 *
 * Custom error class used throughout the app so the centralized error
 * handler middleware can distinguish "expected" operational errors
 * (bad input, not found, etc.) from unexpected bugs, and respond with
 * the right HTTP status code.
 */

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Object.setPrototypeOf(this, AppError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}
