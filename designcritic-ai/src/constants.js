// Mirrors backend/utils/categories.js so labels stay consistent between
// what the AI scores and what the UI renders. Kept as plain data (not
// imported cross-project) since frontend and backend ship separately.
export const CATEGORY_LABELS = {
  visualHierarchy: "Visual Hierarchy",
  typography: "Typography",
  composition: "Composition",
  color: "Color",
  spacing: "Spacing",
  readability: "Readability",
  branding: "Branding",
  communication: "Communication",
  professionalPolish: "Professional Polish",
};

export const CATEGORY_ORDER = Object.keys(CATEGORY_LABELS);

export const DESIGN_TYPES = [
  "Instagram Post",
  "Poster",
  "Advertisement",
  "Flyer",
  "YouTube Thumbnail",
  "UI Design",
  "Logo",
  "Presentation Slide",
  "Other",
];

export const ACCEPTED_MIME_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
// Fallback used only until GET /api/health returns the backend's actual
// configured MAX_UPLOAD_MB (or if that request fails). The backend is the
// authoritative source of truth for this value — see App.jsx.
export const MAX_FILE_SIZE_MB = 20;

export const LOADING_MESSAGES = [
  "Uploading your design…",
  "Inspecting visual hierarchy…",
  "Analyzing typography…",
  "Evaluating color and contrast…",
  "Reviewing composition and spacing…",
  "Generating professional feedback…",
];

export const PRIORITY_ORDER = { High: 0, Medium: 1, Low: 2 };
