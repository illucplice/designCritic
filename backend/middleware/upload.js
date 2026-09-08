import multer from "multer";
import { config, ACCEPTED_MIME_TYPES } from "../config/index.js";
import { AppError } from "../utils/AppError.js";

const ALLOWED_MIME_TYPES = new Set(ACCEPTED_MIME_TYPES);

const storage = multer.memoryStorage();

function fileFilter(req, file, cb) {
  if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
    cb(new AppError(415, "Unsupported file type. Please upload a PNG, JPG, or WEBP image."));
    return;
  }
  cb(null, true);
}

export const uploadImage = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.maxUploadBytes,
    files: 1,
  },
}).single("image");

// Wraps multer so its errors (file too large, wrong field, etc.) flow through
// our normal JSON error handler instead of crashing the request.
export function handleUpload(req, res, next) {
  uploadImage(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return next(
          new AppError(
            413,
            `Image is too large. Please upload a file under ${Math.round(
              config.maxUploadBytes / (1024 * 1024)
            )}MB.`
          )
        );
      }
      return next(new AppError(400, "Upload failed: " + err.message));
    }
    if (err) return next(err);
    if (!req.file) {
      return next(new AppError(400, "No image was uploaded. Please attach a design to analyze."));
    }
    next();
  });
}
