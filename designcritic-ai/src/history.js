// Persistence helpers for analysis history. Deliberately separate from the
// analysis/upload logic in App.jsx so each concern can change independently.

import { normalizeAnalysis } from "./analysisContract.js";

export const HISTORY_STORAGE_KEY = "designcritic:history:v1";
export const MAX_HISTORY_ITEMS = 30;
const THUMBNAIL_MAX_DIMENSION = 480;
const THUMBNAIL_QUALITY = 0.6;

/**
 * Downscales a data-URL image to a small JPEG thumbnail so we never write
 * full-resolution uploads into localStorage (which has a ~5-10MB quota
 * shared with everything else on the origin). Returns null if the image
 * can't be decoded, so callers can fall back to storing no image rather
 * than failing the whole save.
 */
export function createThumbnail(dataUrl) {
  return new Promise((resolve) => {
    if (!dataUrl || typeof dataUrl !== "string") {
      resolve(null);
      return;
    }
    const img = new Image();
    img.onload = () => {
      try {
        const scale = Math.min(1, THUMBNAIL_MAX_DIMENSION / Math.max(img.width, img.height));
        const width = Math.max(1, Math.round(img.width * scale));
        const height = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", THUMBNAIL_QUALITY));
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = dataUrl;
  });
}

function isPlausibleHistoryEntry(entry) {
  return (
    entry &&
    typeof entry === "object" &&
    typeof entry.id === "string" &&
    entry.analysis &&
    typeof entry.analysis === "object"
  );
}

/**
 * Reads and validates persisted history. Any corruption — invalid JSON,
 * wrong shape, a non-array — is treated as "no history" rather than
 * thrown, so a bad localStorage value can never break app startup.
 */
export function loadHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(isPlausibleHistoryEntry)
      .slice(0, MAX_HISTORY_ITEMS)
      .map((entry) => ({ ...entry, analysis: normalizeAnalysis(entry.analysis) }));
  } catch {
    return [];
  }
}

/**
 * Persists history with thumbnailed images, capped to MAX_HISTORY_ITEMS
 * most-recent entries. Swallows quota/serialization errors — losing
 * persistence for one save should never crash the app — but progressively
 * trims the list and retries a couple of times first, since the most
 * common real-world cause is simply "too much history".
 */
export async function saveHistory(history) {
  const capped = history.slice(0, MAX_HISTORY_ITEMS);
  const withThumbnails = await Promise.all(
    capped.map(async (entry) => ({
      ...entry,
      image: entry.image ? await createThumbnail(entry.image) : entry.image,
    }))
  );

  let attempt = withThumbnails;
  for (let i = 0; i < 3; i++) {
    try {
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(attempt));
      return;
    } catch {
      if (attempt.length <= 1) {
        console.warn("Couldn't persist analysis history — localStorage may be full or unavailable.");
        return;
      }
      attempt = attempt.slice(0, Math.ceil(attempt.length / 2));
    }
  }
}
