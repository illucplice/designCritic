import { CATEGORIES } from "./categories.js";

/**
 * Computes the true overall score as a weighted average of validated
 * per-category scores. This is the ONLY place the overall score is
 * calculated — we never trust a top-level "overallScore" the AI invents,
 * and a category that wasn't validated must never silently pull the
 * average down (it simply isn't included in the weighted sum).
 *
 * @param {Record<string, { score: number | null }>} categories - keyed by
 *   category key, each with a numeric score already clamped to [0, 10], or
 *   null if that category is missing/invalid.
 * @returns {number} the weighted overall score, rounded to 1 decimal place.
 */
export function computeWeightedScore(categories) {
  let weightedSum = 0;
  let weightTotal = 0;

  for (const { key, weight } of CATEGORIES) {
    const score = categories?.[key]?.score;
    if (typeof score !== "number" || Number.isNaN(score)) continue;
    weightedSum += score * weight;
    weightTotal += weight;
  }

  if (weightTotal === 0) return 0;
  return Math.round((weightedSum / weightTotal) * 10) / 10;
}

/**
 * Clamps a raw value to a valid score in [0, 10] with one decimal place,
 * or returns null if it isn't a usable number at all.
 */
export function clampScore(value) {
  const n = Number(value);
  if (typeof value === "boolean" || value === null || value === "" || Number.isNaN(n)) return null;
  if (!Number.isFinite(n)) return null;
  return Math.max(0, Math.min(10, Math.round(n * 10) / 10));
}
