/**
 * FILENAME: src/middleware/authMiddleware.ts
 * DESCRIPTION: Intercepts inbound calls to load, verify, and lock token payloads to session contexts.
 */
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthenticatedRequest extends Request {
  business?: {
    id: string;
    email: string;
  };
}

export const protectTenant = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ success: false, message: "Unauthorized access: Missing session token." });
    return;
  }

  const token = authHeader.split(" ")[1];

  try {
    // Decodes the token payload signature securely
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback_secret_key") as { id: string; email: string };
    
    // Binds the tenant context directly onto the request pipeline
    req.business = decoded;
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: "Unauthorized access: Session token expired or invalid." });
  }
};