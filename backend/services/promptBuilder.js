import { CATEGORIES } from "../utils/categories.js";

const MODE_INSTRUCTIONS = {
  Quick:
    "Mode: QUICK. Still score every category and fill every field in the JSON schema, " +
    "but keep every string SHORT — one plain sentence each. strengths/issues/recommendations " +
    "arrays should have at most 2 items per category. Keep summary and finalVerdict to 1-2 sentences.",
  Professional:
    "Mode: PROFESSIONAL. Write like detailed feedback from a senior professional graphic designer " +
    "or art director speaking to a design peer. Be thorough, specific, and reference design " +
    "principles by name where relevant (e.g. contrast, proximity, visual weight, F-pattern, rule of thirds).",
  Brutal:
    "Mode: BRUTAL. Be direct and unflinching about real problems — do not soften language for the " +
    "sake of politeness, and do not pad the critique with unearned praise. However, NEVER be abusive, " +
    "mocking, or insulting toward the designer. Every criticism must still be specific, grounded in what " +
    "is actually visible, and paired with an actionable fix. Do not invent flaws that are not present.",
  Roast:
    "Mode: ROAST. Give a witty, sharp design roast that feels like a creative director roasting the work in a friendly studio. Roast the DESIGN, not the person. Keep it playful, specific, and grounded in visible choices. Never use slurs, harassment, personal attacks, or degrading language. Still provide honest scores and actionable fixes.",
};

const CATEGORY_GUIDANCE = {
  visualHierarchy:
    "What the viewer notices first; whether the most important content gets the most attention; whether elements compete for attention; whether the eye follows a logical path.",
  typography:
    "Font hierarchy, pairing, consistency, sizes, readability, line height, letter spacing, alignment, text contrast. If there is little to no visible text, say so explicitly instead of inventing typography critique.",
  composition: "Balance, alignment, element positioning, negative space, visual flow, cropping, proportions, overall structure.",
  color: "Color harmony, palette consistency, contrast, emotional impact, brand appropriateness, and accessibility of the color choices.",
  spacing: "Padding, margins, consistency of spacing, crowded areas, excessive empty space, alignment gaps.",
  readability: "Text visibility against its background, contrast, font size, and overall clarity of information.",
  branding: "Visual consistency, brand personality, memorability, professional appearance, whether elements work together as a system.",
  communication: "Whether the design communicates its message quickly, whether the likely target audience can understand it, whether any call to action is visible, whether unnecessary elements create confusion.",
  professionalPolish: "Alignment precision, consistency, attention to detail, visual refinement, whether the design feels finished versus rough.",
};

export function buildAnalysisPrompt({ mode, designType, audience, platform, goal }) {
  const categoryList = CATEGORIES.map(
    (c) => `- "${c.key}" (${c.label}): ${CATEGORY_GUIDANCE[c.key]}`
  ).join("\n");

  const contextLines = [
    designType ? `Design type: ${designType}` : null,
    audience ? `Target audience: ${audience}` : null,
    platform ? `Platform / context: ${platform}` : null,
    goal ? `Intended goal / message: ${goal}` : null,
  ].filter(Boolean);

  return `You are a senior art director and design critic reviewing a real, uploaded design image.

${MODE_INSTRUCTIONS[mode] || MODE_INSTRUCTIONS.Professional}

${contextLines.length ? "Context provided by the designer:\n" + contextLines.join("\n") + "\n" : ""}
CRITICAL RULES:
1. Base every observation strictly on what is ACTUALLY VISIBLE in the uploaded image. Never invent elements, text, or problems that are not present.
2. Do not criticize typography if there is little or no visible text — say so instead of fabricating a typography critique.
3. Every strength, issue, and recommendation must reference a specific, concrete visual characteristic (e.g. "the large red headline in the upper third" or "the light-grey body copy against the white background"), never a generic template line.
4. Score honestly. Do not inflate scores to be nice, and do not deflate them to seem tough — the score must reflect genuine design quality. Use the full 0-10 range where warranted.
5. Only list an item in "elements.detected" if you can confidently identify it in the image.
6. Call the submit_design_critique tool exactly once with your complete critique. Every field in the tool's schema is required — do not leave any category out.
7. The "roast" field must be a short, witty roast grounded in visible design choices when mode is ROAST; otherwise return an empty string.

Score each of these 9 categories individually, each 0-10 (one decimal place allowed):
${categoryList}

Include 3 to 5 items in priorityFixes, ordered from most to least important. The tool's "overallScore"-equivalent is recalculated on our end from your category scores, so focus on making each category score accurate rather than any top-level number.`;
}
