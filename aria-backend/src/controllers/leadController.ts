/**
 * FILENAME: src/controllers/leadController.ts
 */
import { Request, Response } from "express";
import { LeadModel, LEAD_STATUSES, LeadStatus } from "../models/leadModel";
import { scoreLead } from "../utils/leadScoring";

// Handles GET /leads?businessId=...
// Recomputes each lead's score at read-time (cheap arithmetic, always fresh —
// a lead that's gone quiet since it was last written will correctly cool
// down even if nothing has touched the DB row since).
export const getLeads = async (req: Request, res: Response) => {
  try {
    const { businessId } = req.query as { businessId?: string };

    const leads = businessId
      ? await LeadModel.findAllByBusiness(businessId)
      : await LeadModel.findAll();

    const scored = leads
      .map((lead) => {
        const { score, label } = scoreLead(lead);
        return { ...lead, score, scoreLabel: label };
      })
      .sort((a, b) => b.score - a.score);

    return res.status(200).json({
      success: true,
      data: scored,
    });
  } catch (error: any) {
    console.error("❌ Error fetching leads:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Error fetching leads",
    });
  }
};

// Handles PATCH /leads/:id/status  { status: "contacted" | "scheduled" | "converted" | "lost", followUpAt?: string }
export const updateLeadStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, followUpAt } = req.body as { status: LeadStatus; followUpAt?: string };

    if (!status || !LEAD_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `status must be one of: ${LEAD_STATUSES.join(", ")}`,
      });
    }

    const updated = await LeadModel.updateStatus(id, status, followUpAt);

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Lead not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: updated,
    });
  } catch (error: any) {
    console.error("❌ Error updating lead status:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Error updating lead status",
    });
  }
};

// Handles DELETE /leads/:id
export const deleteLead = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = await LeadModel.delete(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Lead not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Lead deleted successfully.",
    });
  } catch (error: any) {
    console.error("❌ Error deleting lead:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Error deleting lead",
    });
  }
};