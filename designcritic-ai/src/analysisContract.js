// Defensive normalization for analysis objects — whether they just came
// back from the backend or were restored from localStorage history. The
// backend already validates rigorously (see backend/utils/validateAnalysis.js),
// but the frontend must not assume that guarantee forever: a stale
// persisted history entry from an older app version, a network hiccup that
// mangles JSON, or a future change to CATEGORY_ORDER can all produce a
// shape the render code isn't expecting. Rather than let a missing field
// crash the whole Result page, we coerce everything into a safe, complete
// shape once, in one place.

import { CATEGORY_ORDER } from "./constants.js";

function toStringArray(value) {
  if (!Array.isArray(value)) return [];
  return value.filter((v) => typeof v === "string");
}

function toScore(value) {
  const n = Number(value);
  if (typeof value === "boolean" || Number.isNaN(n) || !Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(10, n));
}

function normalizeCategory(raw) {
  return {
    score: toScore(raw?.score),
    strengths: toStringArray(raw?.strengths),
    issues: toStringArray(raw?.issues),
    recommendations: toStringArray(raw?.recommendations),
  };
}

function normalizePriorityFix(raw) {
  const validPriorities = ["High", "Medium", "Low"];
  return {
    priority: validPriorities.includes(raw?.priority) ? raw.priority : "Medium",
    problem: typeof raw?.problem === "string" ? raw.problem : "",
    why: typeof raw?.why === "string" ? raw.why : "",
    recommendation: typeof raw?.recommendation === "string" ? raw.recommendation : "",
  };
}

/**
 * Returns a complete, safe-to-render analysis object. Every category in
 * CATEGORY_ORDER is guaranteed to exist with numeric score + array fields,
 * every list field is guaranteed to be an array, and the overall score is
 * a finite number in [0, 10]. Never throws — worst case, missing data
 * becomes empty/zeroed rather than crashing the page.
 */
export function normalizeAnalysis(raw) {
  const source = raw && typeof raw === "object" ? raw : {};
  const sourceCategories = source.categories && typeof source.categories === "object" ? source.categories : {};

  const categories = {};
  for (const key of CATEGORY_ORDER) {
    categories[key] = normalizeCategory(sourceCategories[key]);
  }

  return {
    overallScore: toScore(source.overallScore),
    roast: typeof source.roast === "string" ? source.roast : "",
    summary: typeof source.summary === "string" ? source.summary : "",
    categories,
    whatWorks: toStringArray(source.whatWorks),
    needsImprovement: toStringArray(source.needsImprovement),
    priorityFixes: Array.isArray(source.priorityFixes) ? source.priorityFixes.map(normalizePriorityFix) : [],
    elements: {
      detected: toStringArray(source.elements?.detected),
      notes: typeof source.elements?.notes === "string" ? source.elements.notes : "",
    },
    finalVerdict: typeof source.finalVerdict === "string" ? source.finalVerdict : "",
    mode: typeof source.mode === "string" ? source.mode : undefined,
  };
}
