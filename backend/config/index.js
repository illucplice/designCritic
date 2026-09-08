import "dotenv/config";

function requireEnv(name) {
  const value = process.env[name];
  if (!value || !value.trim()) {
    return null;
  }
  return value.trim();
}

function positiveNumber(name, fallback) {
  const raw = process.env[name];
  if (raw === undefined || raw === "") return fallback;
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) {
    console.warn(`⚠  ${name}="${raw}" is not a positive number. Falling back to ${fallback}.`);
    return fallback;
  }
  return n;
}

const apiKey = requireEnv("GEMINI_API_KEY");

export const ACCEPTED_MIME_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"];

export const config = {
  port: Number(process.env.PORT) || 8787,
  geminiApiKey: apiKey,
  aiModel: process.env.AI_MODEL || "gemini-3.6-flash",
  corsOrigins: (process.env.CORS_ORIGIN || "http://localhost:5173")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
  maxUploadBytes: positiveNumber("MAX_UPLOAD_MB", 20) * 1024 * 1024,
  maxUploadMb: positiveNumber("MAX_UPLOAD_MB", 20),
  rateLimitWindowMs: positiveNumber("RATE_LIMIT_WINDOW_MINUTES", 15) * 60 * 1000,
  rateLimitMax: positiveNumber("RATE_LIMIT_MAX_REQUESTS", 30),
  // Longest dimension an image is resized to before being sent to the model.
  // Keeps requests fast/cheap without meaningfully hurting analysis quality.
  maxImageDimension: 1568,
  jpegQuality: 85,
  // Guards against decompression-bomb style images (huge pixel counts in a
  // tiny compressed file) before we even attempt to resize them.
  maxImageMegapixels: positiveNumber("MAX_IMAGE_MEGAPIXELS", 40),
  // How long we'll wait for a single Gemini API call before giving up.
  aiTimeoutMs: positiveNumber("AI_TIMEOUT_MS", 120000),
  // How many extra attempts we'll make if the AI returns an
  // incomplete/malformed analysis (not counting network-level retries the
  // SDK already does internally for transient failures).
  aiMaxRetries: Math.max(0, Math.round(positiveNumber("AI_MAX_RETRIES", 2))),
  isProduction: process.env.NODE_ENV === "production",
  trustProxy: process.env.TRUST_PROXY || false,
};

export function isAiConfigured() {
  return Boolean(config.geminiApiKey);
}

/**
 * Runs at server startup so misconfiguration fails loudly and immediately
 * instead of surfacing as a confusing runtime error on someone's first
 * request. GEMINI_API_KEY is intentionally not required here — the app
 * is designed to start without it and return a clear 503 from the analyze
 * endpoint instead, which is friendlier for local setup.
 */
export function validateConfigOrExit() {
  const problems = [];

  if (!config.corsOrigins.length) {
    problems.push("CORS_ORIGIN resolved to an empty list — set at least one allowed origin.");
  }
  if (config.port <= 0 || config.port > 65535) {
    problems.push(`PORT="${process.env.PORT}" is not a valid port number.`);
  }

  if (problems.length) {
    console.error("✖ Invalid configuration:\n" + problems.map((p) => `  - ${p}`).join("\n"));
    process.exit(1);
  }

  if (!isAiConfigured()) {
    console.warn(
      "⚠  GEMINI_API_KEY is not set. Copy .env.example to .env and add your key, " +
        "or /api/analyze-design will return a clear 503 error instead of crashing."
    );
  }
}
