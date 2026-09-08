import { Router } from "express";
import rateLimit from "express-rate-limit";
import { config } from "../config/index.js";
import { handleUpload } from "../middleware/upload.js";
import { analyzeDesign, healthCheck } from "../controllers/analyzeController.js";

const router = Router();

const analyzeLimiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: true,
    message: "Too many analysis requests. Please wait a few minutes and try again.",
  },
});

router.get("/health", healthCheck);
router.post("/analyze-design", analyzeLimiter, handleUpload, analyzeDesign);

export default router;
