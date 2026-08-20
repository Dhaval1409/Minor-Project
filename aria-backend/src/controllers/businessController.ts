// src/controllers/businessController.ts

import { Request, Response } from "express";
import BusinessModel from "../models/businessModel";
import { v4 as uuidv4 } from "uuid";

/**
 * CREATE BUSINESS
 */
export const createBusiness = async (req: Request, res: Response) => {
  try {
    const {
      name,
      businessType,
      city,
      hours,
      servicesProvided,
      telegramBotToken,
      phone,
      description,
      contactEmail,
      galleryImages,
    } = req.body;

    const business = await BusinessModel.create({
      name,
      businessType,
      city: city || "",
      hours: hours || {
        opens: "10:00 AM",
        closes: "08:00 PM",
      },
      servicesProvided: servicesProvided || [],
      telegramBotToken,
      phone: phone || "",
      description: description || "",
      contactEmail: contactEmail || "",

      // Multiple business gallery images
      galleryImages: Array.isArray(galleryImages)
        ? galleryImages
        : [],
    });

    res.status(201).json({
      success: true,
      data: business,
    });
  } catch (error: any) {
    console.error("Error creating business:", error);

    res.status(500).json({
      success: false,
      message: error.message || "Failed to create business",
    });
  }
};

/**
 * GET BUSINESS BY ID
 *
 * Used for both the authenticated dashboard/settings lookup
 * AND the public customer-facing profile page (pocustomer/[id]).
 */
export const getBusiness = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const business = await BusinessModel.findById(id).select(
      [
        "name",
        "businessType",
        "city",
        "ownerName",
        "description",
        "rating",
        "reviewCount",
        "image",
        "logo",
        "galleryImages",
        "featured",
        "verified",
        "services",
        "servicesProvided",
        "hours",
        "phone",
        "contactEmail",
      ].join(" ")
    );

    if (!business) {
      return res.status(404).json({
        success: false,
        message: "Business not found",
      });
    }

    res.status(200).json({
      success: true,
      data: business,
    });
  } catch (error: any) {
    // An invalid ObjectId (wrong length/format) throws a CastError here
    // rather than returning null — treat it the same as "not found".
    if (error.name === "CastError") {
      return res.status(404).json({
        success: false,
        message: "Business not found",
      });
    }

    console.error("Error getting business:", error);

    res.status(500).json({
      success: false,
      message: error.message || "Failed to get business",
    });
  }
};

/**
 * UPDATE BUSINESS
 *
 * Supports:
 * - name
 * - ownerName
 * - businessType
 * - city
 * - hours
 * - servicesProvided
 * - services
 * - telegramBotToken
 * - phone
 * - galleryImages
 * - description
 * - contactEmail
 * - image
 * - logo
 */
export const updateBusiness = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const {
      name,
      ownerName,
      businessType,
      city,
      hours,
      servicesProvided,
      services,
      telegramBotToken,
      phone,
      galleryImages,
      description,
      contactEmail,
      image,
      logo,
    } = req.body;

    // Build update object only with fields that were provided
    const updates: Record<string, any> = {};

    if (name !== undefined) updates.name = name;
    if (ownerName !== undefined) updates.ownerName = ownerName;
    if (businessType !== undefined) updates.businessType = businessType;
    if (city !== undefined) updates.city = city;
    if (hours !== undefined) updates.hours = hours;
    if (servicesProvided !== undefined) {
      updates.servicesProvided = servicesProvided;
    }

    if (services !== undefined) {
      updates.services = services;
    }

    if (telegramBotToken !== undefined) {
      updates.telegramBotToken = telegramBotToken;
    }

    if (phone !== undefined) updates.phone = phone;

    // ==========================================
    // GALLERY IMAGES
    // ==========================================
    if (galleryImages !== undefined) {
      if (!Array.isArray(galleryImages)) {
        return res.status(400).json({
          success: false,
          message: "galleryImages must be an array of image URLs",
        });
      }

      updates.galleryImages = galleryImages;
    }

    if (description !== undefined) updates.description = description;
    if (contactEmail !== undefined) {
      updates.contactEmail = contactEmail;
    }

    if (image !== undefined) updates.image = image;
    if (logo !== undefined) updates.logo = logo;

    const business = await BusinessModel.findByIdAndUpdate(
      id,
      {
        $set: updates,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!business) {
      return res.status(404).json({
        success: false,
        message: "Business not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Business updated successfully",
      data: business,
    });
  } catch (error: any) {
    if (error.name === "CastError") {
      return res.status(404).json({
        success: false,
        message: "Business not found",
      });
    }

    console.error("Error updating business:", error);

    res.status(500).json({
      success: false,
      message: error.message || "Failed to update business",
    });
  }
};

/**
 * DELETE BUSINESS
 */
export const deleteBusiness = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const business = await BusinessModel.findByIdAndDelete(id);

    if (!business) {
      return res.status(404).json({
        success: false,
        message: "Business not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Business deleted successfully",
    });
  } catch (error: any) {
    if (error.name === "CastError") {
      return res.status(404).json({
        success: false,
        message: "Business not found",
      });
    }

    console.error("Error deleting business:", error);

    res.status(500).json({
      success: false,
      message: error.message || "Failed to delete business",
    });
  }
};

/**
 * GET SERVICES
 */
export const getServices = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const business = await BusinessModel.findById(id);

    if (!business) {
      return res.status(404).json({
        success: false,
        message: "Business not found",
      });
    }

    res.status(200).json({
      success: true,
      data: business.services,
    });
  } catch (error: any) {
    console.error("Error fetching services:", error);

    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch services",
    });
  }
};

/**
 * ADD SERVICE
 */
export const addService = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, price, duration } = req.body;

    if (!name || price === undefined || price === null) {
      return res.status(400).json({
        success: false,
        message: "name and price are required",
      });
    }

    const business = await BusinessModel.findById(id);

    if (!business) {
      return res.status(404).json({
        success: false,
        message: "Business not found",
      });
    }

    business.services.push({
      id: uuidv4(),
      name,
      price,
      duration: duration || "",
      active: true,
    } as any);

    await business.save();

    res.status(201).json({
      success: true,
      data: business.services,
    });
  } catch (error: any) {
    console.error("Error adding service:", error);

    res.status(500).json({
      success: false,
      message: error.message || "Failed to add service",
    });
  }
};

/**
 * UPDATE SERVICE
 */
export const updateService = async (req: Request, res: Response) => {
  try {
    const { id, serviceId } = req.params;
    const { name, price, duration, active } = req.body;

    const business = await BusinessModel.findById(id);

    if (!business) {
      return res.status(404).json({
        success: false,
        message: "Business not found",
      });
    }

    const service = business.services.find(
      (s: any) => s.id === serviceId
    );

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found",
      });
    }

    if (name !== undefined) service.name = name;
    if (price !== undefined) service.price = price;
    if (duration !== undefined) service.duration = duration;
    if (active !== undefined) service.active = active;

    await business.save();

    res.status(200).json({
      success: true,
      data: business.services,
    });
  } catch (error: any) {
    console.error("Error updating service:", error);

    res.status(500).json({
      success: false,
      message: error.message || "Failed to update service",
    });
  }
};

/**
 * DELETE SERVICE
 */
export const deleteService = async (req: Request, res: Response) => {
  try {
    const { id, serviceId } = req.params;

    const business = await BusinessModel.findById(id);

    if (!business) {
      return res.status(404).json({
        success: false,
        message: "Business not found",
      });
    }

    const before = business.services.length;

    business.services = business.services.filter(
      (s: any) => s.id !== serviceId
    ) as any;

    if (business.services.length === before) {
      return res.status(404).json({
        success: false,
        message: "Service not found",
      });
    }

    await business.save();

    res.status(200).json({
      success: true,
      data: business.services,
    });
  } catch (error: any) {
    console.error("Error deleting service:", error);

    res.status(500).json({
      success: false,
      message: error.message || "Failed to delete service",
    });
  }
};

/**
 * IMPORT LEGACY SERVICES
 */
export const importLegacyServices = async (
  req: Request,
  res: Response
) => {
  try {
    const { id } = req.params;

    const business = await BusinessModel.findById(id);

    if (!business) {
      return res.status(404).json({
        success: false,
        message: "Business not found",
      });
    }

    const existingNames = new Set(
      business.services.map(
        (s: any) => s.name.trim().toLowerCase()
      )
    );

    const toImport = (business.servicesProvided || []).filter(
      (name) =>
        name &&
        !existingNames.has(name.trim().toLowerCase())
    );

    for (const name of toImport) {
      business.services.push({
        id: uuidv4(),
        name: name.trim(),
        price: 0,
        duration: "",
        active: true,
      } as any);
    }

    if (toImport.length > 0) {
      await business.save();
    }

    res.status(200).json({
      success: true,
      imported: toImport.length,
      data: business.services,
    });
  } catch (error: any) {
    console.error("Error importing legacy services:", error);

    res.status(500).json({
      success: false,
      message:
        error.message || "Failed to import legacy services",
    });
  }
};

/**
 * PUBLIC BUSINESS LISTING
 */
export const listBusinesses = async (
  req: Request,
  res: Response
) => {
  try {
    const businesses = await BusinessModel.find()
      .select(
        "name businessType city ownerName description rating reviewCount image logo galleryImages featured verified services servicesProvided createdAt"
      )
      .lean();

    res.status(200).json({
      success: true,
      data: businesses,
    });
  } catch (error: any) {
    console.error("Error listing businesses:", error);

    res.status(500).json({
      success: false,
      message: error.message || "Failed to list businesses",
    });
  }
};