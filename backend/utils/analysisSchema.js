import { CATEGORIES, PRIORITY_LEVELS } from "./categories.js";

const stringArray = (description, maxItems) => ({
  type: "array",
  items: { type: "string" },
  maxItems,
  description,
});

const categoryProperties = {};
for (const { key, label } of CATEGORIES) {
  categoryProperties[key] = {
  type: "object",
    description: `Critique of the "${label}" dimension.`,
  properties: {
      score: {
        type: "number",
        minimum: 0,
        maximum: 10,
        description: "0-10 score, one decimal place allowed. Must reflect genuine quality.",
      },
      strengths: stringArray("Concrete strengths for this category, grounded in the image.", 5),
      issues: stringArray("Concrete issues for this category, grounded in the image.", 5),
      recommendations: stringArray("Concrete, actionable fixes for this category.", 5),
    },
    required: ["score", "strengths", "issues", "recommendations"],
  };
}

/**
 * The tool Claude is forced to call. Using tool_choice with this schema is
 * the strongest structured-output guarantee the Messages API offers: the
 * model's output is constrained to match this shape and arrives as an
 * already-parsed object (tool_use.input) rather than free text we'd have
 * to hope is valid JSON. We still validate everything server-side in
 * validateAnalysis.js — this schema reduces malformed output, it doesn't
 * replace validation.
 */
export const ANALYSIS_TOOL_NAME = "submit_design_critique";

export const analysisResponseSchema = {

    type: "object",
    properties: {
      roast: {
        type: "string",
        description: "A short, witty, playful roast of the design. In Roast mode, be sharper but never abusive or insulting toward the designer. Ground every joke in visible design choices. In other modes, return an empty string.",
      },
      summary: {
        type: "string",
        description: "1-3 sentence summary of the design and its overall quality.",
      },
      categories: {
        type: "object",
        properties: categoryProperties,
        required: CATEGORIES.map((c) => c.key),
      },
      whatWorks: stringArray("3-5 concrete strengths, each grounded in the actual image.", 6),
      needsImprovement: stringArray("3-5 concrete weaknesses, each grounded in the actual image.", 6),
      priorityFixes: {
        type: "array",
        minItems: 3,
        maxItems: 5,
        description: "3-5 fixes, ordered from most to least important.",
        items: {
          type: "object",
          properties: {
            priority: { type: "string", enum: PRIORITY_LEVELS },
            problem: { type: "string" },
            why: { type: "string" },
            recommendation: { type: "string" },
          },
          required: ["priority", "problem", "why", "recommendation"],
        },
      },
      elements: {
        type: "object",
        properties: {
          detected: stringArray("Visual elements you can confidently identify.", 12),
          notes: { type: "string" },
        },
        required: ["detected", "notes"],
      },
      finalVerdict: {
        type: "string",
        description: "2-4 sentence closing verdict on the design's overall quality and readiness.",
      },
    },
  required: ["roast", "summary", "categories", "whatWorks", "needsImprovement", "priorityFixes", "elements", "finalVerdict"],
};
