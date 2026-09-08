import { prepareImageForAnalysis } from "../services/imageProcessingService.js";
import { analyzeDesignImage } from "../services/designAnalysisService.js";
import { AppError } from "../utils/AppError.js";
import { config, isAiConfigured, ACCEPTED_MIME_TYPES } from "../config/index.js";

const VALID_MODES = new Set(["Quick", "Professional", "Brutal", "Roast"]);

function sanitizeText(value, maxLen) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLen);
}

export async function analyzeDesign(req, res, next) {
  try {
    if (!req.file || !req.file.buffer || req.file.buffer.length === 0) {
      throw new AppError(400, "No image was uploaded. Please attach a design to analyze.");
    }

    const mode = VALID_MODES.has(req.body.mode) ? req.body.mode : "Professional";
    const designType = sanitizeText(req.body.designType, 60);
    const audience = sanitizeText(req.body.audience, 200);
    const platform = sanitizeText(req.body.platform, 100);
    const goal = sanitizeText(req.body.goal, 500);

    const image = await prepareImageForAnalysis(req.file.buffer);

    const analysis = await analyzeDesignImage({
      image,
      mode,
      designType,
      audience,
      platform,
      goal,
    });

    res.json({
      error: false,
      analysis,
      image: {
        width: image.width,
        height: image.height,
      },
      meta: {
        designType: designType || null,
        audience: audience || null,
        platform: platform || null,
        goal: goal || null,
        analyzedAt: new Date().toISOString(),
      },
    });
  } catch (err) {
    next(err);
  }
}

export function healthCheck(req, res) {
  res.json({
    error: false,
    status: "ok",
    aiConfigured: isAiConfigured(),
    maxUploadMb: config.maxUploadMb,
    acceptedMimeTypes: ACCEPTED_MIME_TYPES,
  });
}
