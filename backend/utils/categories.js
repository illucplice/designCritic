// The 9 critique dimensions the AI must score individually, plus the
// weight each contributes to the overall score. Weights sum to 1.
export const CATEGORIES = [
  { key: "visualHierarchy", label: "Visual Hierarchy", weight: 0.15 },
  { key: "typography", label: "Typography", weight: 0.1 },
  { key: "composition", label: "Composition", weight: 0.12 },
  { key: "color", label: "Color", weight: 0.1 },
  { key: "spacing", label: "Spacing", weight: 0.08 },
  { key: "readability", label: "Readability", weight: 0.1 },
  { key: "branding", label: "Branding", weight: 0.08 },
  { key: "communication", label: "Communication", weight: 0.15 },
  { key: "professionalPolish", label: "Professional Polish", weight: 0.12 },
];

export const PRIORITY_LEVELS = ["High", "Medium", "Low"];

export const CATEGORY_KEYS = CATEGORIES.map((c) => c.key);
