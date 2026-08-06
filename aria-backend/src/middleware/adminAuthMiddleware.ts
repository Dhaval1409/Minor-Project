/**
 * FILENAME: src/middleware/adminAuthMiddleware.ts
 * DESCRIPTION: Verifies the JWT on incoming requests and ensures the token
 * belongs to an authenticated admin (role: "admin") before allowing access
 * to any /admin/* route (except /admin/login itself).
 */
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AdminAuthenticatedRequest extends Request {
  admin?: {
    username: string;
    role: string;
  };
}

export const protectAdmin = (
  req: AdminAuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ success: false, message: "Unauthorized access: Missing admin session token." });
    return;
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback_secret_key") as {
      username: string;
      role: string;
    };

    if (decoded.role !== "admin") {
      res.status(403).json({ success: false, message: "Forbidden: Admin privileges required." });
      return;
    }

    req.admin = decoded;
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: "Unauthorized access: Admin session token expired or invalid." });
  }
};
