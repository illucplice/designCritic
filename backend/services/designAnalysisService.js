import { GoogleGenAI } from "@google/genai";
import { config, isAiConfigured } from "../config/index.js";
import { AppError, IncompleteAnalysisError } from "../utils/AppError.js";
import { validateAnalysis } from "../utils/validateAnalysis.js";
import { analysisResponseSchema } from "../utils/analysisSchema.js";
import { buildAnalysisPrompt } from "./promptBuilder.js";

let client = null;
function getClient() {
  if (!isAiConfigured()) {
    throw new AppError(503, "The AI analysis service isn't configured yet. Add GEMINI_API_KEY to the backend .env file.");
  }
  if (!client) client = new GoogleGenAI({ apiKey: config.geminiApiKey });
  return client;
}

function classifyApiError(err) {
  const status = err?.status || err?.statusCode || err?.error?.code;
  if (status === 401 || status === 403) return new AppError(503, "The AI service rejected our credentials. Check the backend's GEMINI_API_KEY.");
  if (status === 429) return new AppError(429, "The AI service is rate-limited right now. Please wait a moment and try again.");
  if (status === 400 && /image|mime|media/i.test(err?.message || "")) return new AppError(422, "The AI model couldn't process this image. Please try a different file.");
  if (err?.name === "AbortError" || err?.code === "ETIMEDOUT" || /timeout/i.test(err?.message || "")) return new IncompleteAnalysisError("Gemini analysis timed out.");
  return null;
}

async function attemptAnalysis({ ai, prompt, image }) {
  let response;
  try {
    response = await ai.models.generateContent({
      model: config.aiModel,
      contents: [{
        role: "user",
        parts: [
          { inlineData: { mimeType: image.mediaType, data: image.base64 } },
          { text: prompt },
        ],
      }],
      config: {
        responseMimeType: "application/json",
        responseJsonSchema: analysisResponseSchema,
        maxOutputTokens: 4096,
        temperature: 0.35,
        abortSignal: AbortSignal.timeout(config.aiTimeoutMs),
      },
    });
  } catch (err) {
    const classified = classifyApiError(err);
    if (classified) throw classified;
    throw new IncompleteAnalysisError(`AI request failed: ${err?.message || "unknown error"}`);
  }

  const finishReason = response?.candidates?.[0]?.finishReason;
  if (finishReason === "MAX_TOKENS") throw new IncompleteAnalysisError("The AI response was cut off before it finished.");

  const text = response?.text;
  if (!text || typeof text !== "string") throw new IncompleteAnalysisError("The AI did not return a structured critique.");

  let parsed;
  try { parsed = JSON.parse(text); }
  catch { throw new IncompleteAnalysisError("The AI returned malformed JSON."); }

  return validateAnalysis(parsed);
}

export async function analyzeDesignImage(
  { image, mode, designType, audience, platform, goal },
  geminiClient
) {
  const ai = geminiClient || getClient();
  const prompt = buildAnalysisPrompt({ mode, designType, audience, platform, goal });
  const maxAttempts = config.aiMaxRetries + 1;
  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const validated = await attemptAnalysis({ ai, prompt, image });
      return { ...validated, mode, modelUsed: config.aiModel };
    } catch (err) {
      if (err instanceof AppError && !err.isIncompleteAnalysisError) throw err;
      lastError = err;
      if (attempt < maxAttempts) {
        const delayMs = Math.min(1000 * 2 ** (attempt - 1), 4000);
        console.warn(`[designAnalysisService] attempt ${attempt} failed, retrying in ${delayMs}ms: ${err.message}`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      } else if (err?.message?.toLowerCase().includes("timed out")) {
        throw new AppError(504, "The AI analysis timed out. Please try again in a moment.");
      }
    }
  }

  console.error("[designAnalysisService] AI analysis failed after retries:", lastError);
  throw new AppError(502, "The AI's analysis was incomplete or invalid even after a retry. Please try again in a moment.");
}
