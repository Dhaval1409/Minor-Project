/**
 * FILENAME: src/middleware/upload.ts
 *
 * Multer holds the uploaded file in memory (as a Buffer) instead of
 * writing it to disk — we stream that buffer straight to Cloudinary
 * in the controller, so nothing ever touches the server's filesystem.
 */
import multer from "multer";

const storage = multer.memoryStorage();

const imageFileFilter = (
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  if (!file.mimetype.startsWith("image/")) {
    return cb(new Error("Only image files (jpg, png, webp) are allowed"));
  }
  cb(null, true);
};

// Single file, field name "image" — used for the profile photo.
export const uploadSingleImage = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: imageFileFilter,
}).single("image");

// Up to 12 files, field name "images" — used for the business gallery.
export const uploadMultipleImages = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB each
  fileFilter: imageFileFilter,
}).array("images", 12);

/**
 * Multer's own errors (bad file type, file too large, etc.) happen
 * inside the middleware, before your controller runs — without this
 * wrapper they'd fall through to Express's default HTML error page
 * instead of clean JSON. Wrap uploadSingleImage / uploadMultipleImages
 * with this in the route definition.
 */
export const withMulterErrorHandling =
  (middleware: any) =>
  (req: Express.Request, res: any, next: any) => {
    middleware(req, res, (err: any) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message || "Image upload failed",
        });
      }
      next();
    });
  };