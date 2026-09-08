// Thin wrapper around the backend's REST API. Kept in one file so the
// request shape, error handling, and base URL only need to change here.

import { normalizeAnalysis } from "./analysisContract.js";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function parseJsonSafely(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

/**
 * Uploads the design image + analysis settings to the backend and returns
 * the validated critique object. Throws ApiError with a human-readable
 * message on any failure (network, timeout, validation, AI failure).
 */
export async function analyzeDesign({ file, mode, designType, audience, platform, goal, signal }) {
  const formData = new FormData();
  formData.append("image", file);
  formData.append("mode", mode);
  if (designType) formData.append("designType", designType);
  if (audience) formData.append("audience", audience);
  if (platform) formData.append("platform", platform);
  if (goal) formData.append("goal", goal);

  let response;
  try {
    response = await fetch(`${BASE_URL}/analyze-design`, {
      method: "POST",
      body: formData,
      signal,
    });
  } catch (err) {
    if (err.name === "AbortError") throw err;
    throw new ApiError(
      "Couldn't reach the analysis server. Check your connection and that the backend is running.",
      0
    );
  }

  const data = await parseJsonSafely(response);

  if (!response.ok) {
    const message =
      data?.message ||
      (response.status === 413
        ? "That image is too large to analyze."
        : response.status === 429
        ? "Too many requests right now. Please wait a moment and try again."
        : "Unable to analyze your design right now. Please try again in a moment.");
    throw new ApiError(message, response.status);
  }

  if (!data || data.error || !data.analysis) {
    throw new ApiError(data?.message || "The AI response was invalid. Please try again.", response.status);
  }

  // Belt-and-suspenders: the backend already validates this rigorously,
  // but normalizing here means a network hiccup or an unexpected shape
  // degrades gracefully in the UI instead of crashing the Result page.
  return { ...data, analysis: normalizeAnalysis(data.analysis) };
}

export async function checkHealth(signal) {
  try {
    const res = await fetch(`${BASE_URL}/health`, { signal });
    if (!res.ok) return { ok: false, aiConfigured: false };
    const data = await res.json();
    return {
      ok: true,
      aiConfigured: Boolean(data.aiConfigured),
      maxUploadMb: typeof data.maxUploadMb === "number" ? data.maxUploadMb : undefined,
      acceptedMimeTypes: Array.isArray(data.acceptedMimeTypes) ? data.acceptedMimeTypes : undefined,
    };
  } catch {
    return { ok: false, aiConfigured: false };
  }
}
