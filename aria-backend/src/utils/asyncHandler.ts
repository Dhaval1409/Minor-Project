/**
 * utils/asyncHandler.ts
 *
 * Wraps async Express route handlers so thrown errors / rejected promises
 * are automatically forwarded to next(), instead of requiring a
 * try/catch block in every single controller function.
 */

import { Request, Response, NextFunction, RequestHandler } from "express";

type AsyncFn = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<unknown>;

export function asyncHandler(fn: AsyncFn): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
