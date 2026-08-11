/**
 * FILENAME: src/routes/leadRoutes.ts
 */
import { Router } from "express";
import { getLeads, updateLeadStatus, deleteLead } from "../controllers/leadController";

const router = Router();

// 1. Get all leads, optionally scoped to a business (GET /leads?businessId=...)
router.get("/", getLeads);

// 2. Update a lead's status / follow-up time (PATCH /leads/:id/status)
router.patch("/:id/status", updateLeadStatus);

// 3. Remove a lead (DELETE /leads/:id)
router.delete("/:id", deleteLead);

export default router;