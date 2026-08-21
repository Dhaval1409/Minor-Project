// src/controllers/businessController.ts

import { Request, Response } from "express";
import BusinessModel from "../models/businessModel";
import { v4 as uuidv4 } from "uuid";
import cloudinary from "../config/cloudinary";
import { UploadApiResponse } from "cloudinary";

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
        "telegramBotToken",
        "telegramBotLink",
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
 * - telegramBotLink
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
      telegramBotLink,
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

    if (telegramBotLink !== undefined) {
      updates.telegramBotLink = telegramBotLink;
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

// ------------------------------------------------------------------
// IMAGES (Cloudinary) — helpers
// ------------------------------------------------------------------

/**
 * Streams a Buffer (from multer's memoryStorage) straight to Cloudinary.
 * No temp files touch the server disk.
 */
function uploadBufferToCloudinary(
  buffer: Buffer,
  folder: string
): Promise<UploadApiResponse> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "image" },
      (error, result) => {
        if (error || !result) {
          return reject(error || new Error("Cloudinary upload failed"));
        }
        resolve(result);
      }
    );
    stream.end(buffer);
  });
}

/**
 * Pulls the Cloudinary public_id back out of a secure_url so we can
 * delete the old asset when a photo is replaced/removed, e.g.:
 *   https://res.cloudinary.com/xbicmhte/image/upload/v123/aria/business/64f.../profile/abc123.jpg
 *   -> aria/business/64f.../profile/abc123
 * Returns null for anything that isn't a Cloudinary URL (so we never
 * try to "delete" some other host's image by mistake).
 */
function extractCloudinaryPublicId(url: string): string | null {
  if (!url || !url.includes("res.cloudinary.com")) return null;
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[a-zA-Z0-9]+(?:\?.*)?$/);
  return match ? match[1] : null;
}

// ------------------------------------------------------------------
// PROFILE / LOGO IMAGE — single image, replaces whatever was there
// ------------------------------------------------------------------

/**
 * POST /business/:id/upload-image
 * multipart/form-data, field name: "image"
 *
 * Always REPLACES the existing image (old Cloudinary asset is deleted),
 * so re-uploading never leaves orphaned images behind.
 */
export const uploadProfileImage = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const file = (req as any).file as Express.Multer.File | undefined;

    if (!file) {
      return res.status(400).json({
        success: false,
        message: "No image file provided (expected field name 'image').",
      });
    }

    const business = await BusinessModel.findById(id);
    if (!business) {
      return res.status(404).json({
        success: false,
        message: "Business not found",
      });
    }

    const result = await uploadBufferToCloudinary(
      file.buffer,
      `aria/business/${id}/profile`
    );

    // Clean up the old image on Cloudinary so replacing a photo doesn't
    // silently accumulate storage.
    const oldPublicId = extractCloudinaryPublicId(business.image || "");
    if (oldPublicId) {
      cloudinary.uploader.destroy(oldPublicId).catch((err) => {
        console.error("⚠️ Failed to delete old profile image:", err);
      });
    }

    business.image = result.secure_url;
    await business.save();

    res.status(200).json({
      success: true,
      data: { image: business.image },
    });
  } catch (error: any) {
    console.error("Error uploading profile image:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to upload image",
    });
  }
};

/**
 * DELETE /business/:id/profile-image
 * Removes the current profile/logo image.
 */
export const deleteProfileImage = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const business = await BusinessModel.findById(id);
    if (!business) {
      return res.status(404).json({
        success: false,
        message: "Business not found",
      });
    }

    const publicId = extractCloudinaryPublicId(business.image || "");
    if (publicId) {
      cloudinary.uploader.destroy(publicId).catch((err) => {
        console.error("⚠️ Failed to delete profile image from Cloudinary:", err);
      });
    }

    business.image = "";
    await business.save();

    res.status(200).json({ success: true, data: { image: "" } });
  } catch (error: any) {
    console.error("Error deleting profile image:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to delete image",
    });
  }
};

// ------------------------------------------------------------------
// GALLERY IMAGES — multiple images, capped at 12, always appended
// server-side against the CURRENT saved count (not whatever the
// client thinks it has), so duplicates/overflow can't happen.
// ------------------------------------------------------------------

const GALLERY_LIMIT = 12;

/**
 * POST /business/:id/upload-gallery
 * multipart/form-data, field name: "images" (can send multiple files)
 *
 * Returns the FULL updated galleryImages array — the frontend should
 * always replace its local state with this response rather than
 * appending locally, so it can never drift out of sync with the DB.
 */
export const uploadGalleryImages = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const files = (req as any).files as Express.Multer.File[] | undefined;

    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No image files provided (expected field name 'images').",
      });
    }

    const business = await BusinessModel.findById(id);
    if (!business) {
      return res.status(404).json({
        success: false,
        message: "Business not found",
      });
    }

    const currentCount = business.galleryImages?.length || 0;
    const room = GALLERY_LIMIT - currentCount;

    if (room <= 0) {
      return res.status(400).json({
        success: false,
        message: `Gallery limit of ${GALLERY_LIMIT} photos reached. Remove some photos before adding more.`,
      });
    }

    const filesToUpload = files.slice(0, room);

    const uploaded = await Promise.all(
      filesToUpload.map((file) =>
        uploadBufferToCloudinary(file.buffer, `aria/business/${id}/gallery`)
      )
    );

    const newUrls = uploaded.map((r) => r.secure_url);
    business.galleryImages = [...(business.galleryImages || []), ...newUrls];
    await business.save();

    res.status(200).json({
      success: true,
      data: { galleryImages: business.galleryImages },
      skipped: files.length - filesToUpload.length, // how many didn't fit under the cap
    });
  } catch (error: any) {
    console.error("Error uploading gallery images:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to upload images",
    });
  }
};

/**
 * DELETE /business/:id/gallery-image
 * body: { "imageUrl": "https://res.cloudinary.com/..." }
 *
 * Returns the FULL updated galleryImages array (same reasoning as above).
 */
export const deleteGalleryImage = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { imageUrl } = req.body;

    if (!imageUrl) {
      return res.status(400).json({
        success: false,
        message: "imageUrl is required",
      });
    }

    const business = await BusinessModel.findById(id);
    if (!business) {
      return res.status(404).json({
        success: false,
        message: "Business not found",
      });
    }

    const publicId = extractCloudinaryPublicId(imageUrl);
    if (publicId) {
      cloudinary.uploader.destroy(publicId).catch((err) => {
        console.error("⚠️ Failed to delete gallery image from Cloudinary:", err);
      });
    }

    business.galleryImages = (business.galleryImages || []).filter(
      (url) => url !== imageUrl
    );
    await business.save();

    res.status(200).json({
      success: true,
      data: { galleryImages: business.galleryImages },
    });
  } catch (error: any) {
    console.error("Error deleting gallery image:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to delete image",
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
        "name businessType city ownerName description rating reviewCount image logo galleryImages featured verified services servicesProvided telegramBotLink createdAt"
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