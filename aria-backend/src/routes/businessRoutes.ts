/**
 * FILENAME: src/routes/businessRoutes.ts
 */

import express from "express";

import {
  createBusiness,
  getBusiness,
  updateBusiness,
  deleteBusiness,
  getServices,
  addService,
  updateService,
  deleteService,
  importLegacyServices,
  listBusinesses,
} from "../controllers/businessController";

const router = express.Router();

/* ============================================================
   PUBLIC BUSINESS ROUTES
   ============================================================ */

/**
 * GET /business
 * Public business directory
 */
router.get("/", listBusinesses);


/* ============================================================
   BUSINESS CRUD
   ============================================================ */

/**
 * POST /business
 * Create business
 */
router.post("/", createBusiness);

/**
 * GET /business/:id
 * Get business by MongoDB ID.
 * Used by both the owner dashboard/settings screen AND the public
 * customer-facing profile page (pocustomer/[id]).
 */
router.get("/:id", getBusiness);

/**
 * PUT /business/:id
 * Update business
 */
router.put("/:id", updateBusiness);

/**
 * DELETE /business/:id
 * Delete business
 */
router.delete("/:id", deleteBusiness);


/* ============================================================
   SERVICES
   ============================================================ */

/**
 * GET /business/:id/services
 * Get all services
 */
router.get("/:id/services", getServices);

/**
 * POST /business/:id/services
 * Add service
 */
router.post("/:id/services", addService);

/**
 * PUT /business/:id/services/:serviceId
 * Update service
 */
router.put("/:id/services/:serviceId", updateService);

/**
 * DELETE /business/:id/services/:serviceId
 * Delete service
 */
router.delete("/:id/services/:serviceId", deleteService);


/* ============================================================
   LEGACY SERVICES
   ============================================================ */

/**
 * POST /business/:id/services/import-legacy
 * Import servicesProvided[] into services[]
 */
router.post(
  "/:id/services/import-legacy",
  importLegacyServices
);


export default router;