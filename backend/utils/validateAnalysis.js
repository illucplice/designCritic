import { CATEGORIES, PRIORITY_LEVELS } from "./categories.js";
import { IncompleteAnalysisError } from "./AppError.js";
import { clampScore, computeWeightedScore } from "./scoring.js";

function isNonEmptyString(v) {
  return typeof v === "string" && v.trim().length > 0;
}

function cleanStringArray(value, maxItems = 8) {
  if (!Array.isArray(value)) return [];
  return value
    .filter((v) => typeof v === "string" && v.trim().length > 0)
    .map((v) => v.trim())
    .slice(0, maxItems);
}

/**
 * Validates the raw parsed JSON from the model (the tool_use input) against
 * the shape we require. Every one of the 9 categories MUST have a valid
 * numeric score, or this throws IncompleteAnalysisError — the caller
 * (designAnalysisService) is responsible for retrying on that error and
 * only surfacing a user-facing failure once retries are exhausted.
 *
 * We deliberately never do `score ?? 0`: a missing category is a missing
 * category, not a genuine zero, and must never reach the user disguised
 * as one.
 */
export function validateAnalysis(raw) {
  if (!raw || typeof raw !== "object") {
    throw new IncompleteAnalysisError("The AI response was not a usable object.");
  }

  const rawCategories = raw.categories && typeof raw.categories === "object" ? raw.categories : {};
  const categories = {};
  const missingOrInvalid = [];

  for (const { key } of CATEGORIES) {
    const src = rawCategories[key];
    const score = src ? clampScore(src.score) : null;

    if (score === null) {
      missingOrInvalid.push(key);
      continue;
    }

    categories[key] = {
      score,
      strengths: cleanStringArray(src?.strengths),
      issues: cleanStringArray(src?.issues),
      recommendations: cleanStringArray(src?.recommendations),
    };
  }

  if (missingOrInvalid.length > 0) {
    throw new IncompleteAnalysisError(
      `The AI response was missing or had invalid scores for: ${missingOrInvalid.join(", ")}.`
    );
  }

  const overallScore = computeWeightedScore(categories);

  const priorityFixes = Array.isArray(raw.priorityFixes)
    ? raw.priorityFixes
        .filter((f) => f && isNonEmptyString(f.problem))
        .slice(0, 5)
        .map((f) => ({
          priority: PRIORITY_LEVELS.includes(f.priority) ? f.priority : "Medium",
          problem: String(f.problem).trim(),
          why: isNonEmptyString(f.why) ? f.why.trim() : "",
          recommendation: isNonEmptyString(f.recommendation) ? f.recommendation.trim() : "",
        }))
    : [];

  const elements =
    raw.elements && typeof raw.elements === "object"
      ? {
          detected: cleanStringArray(raw.elements.detected, 12),
          notes: isNonEmptyString(raw.elements.notes) ? raw.elements.notes.trim() : "",
        }
      : { detected: [], notes: "" };

  return {
    overallScore,
    roast: isNonEmptyString(raw.roast) ? raw.roast.trim() : "",
    summary: isNonEmptyString(raw.summary) ? raw.summary.trim() : "",
    categories,
    whatWorks: cleanStringArray(raw.whatWorks, 6),
    needsImprovement: cleanStringArray(raw.needsImprovement, 6),
    priorityFixes,
    finalVerdict: isNonEmptyString(raw.finalVerdict) ? raw.finalVerdict.trim() : "",
    elements,
  };
}
