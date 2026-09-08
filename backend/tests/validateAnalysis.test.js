import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { validateAnalysis } from "../utils/validateAnalysis.js";
import { IncompleteAnalysisError } from "../utils/AppError.js";
import { CATEGORIES } from "../utils/categories.js";

function validCategory(score = 7) {
  return { score, strengths: ["strong point"], issues: ["a weak point"], recommendations: ["do this"] };
}

function fullValidRaw(overrides = {}) {
  const categories = {};
  for (const { key } of CATEGORIES) categories[key] = validCategory();
  return {
    summary: "A solid design overall.",
    categories,
    whatWorks: ["good hierarchy"],
    needsImprovement: ["spacing is tight"],
    priorityFixes: [
      { priority: "High", problem: "low contrast text", why: "hurts readability", recommendation: "darken the text" },
    ],
    elements: { detected: ["headline", "logo"], notes: "clean layout" },
    finalVerdict: "A strong design with room to refine.",
    ...overrides,
  };
}

describe("validateAnalysis - valid input", () => {
  test("accepts a fully valid response and computes a real weighted overall score", () => {
    const result = validateAnalysis(fullValidRaw());
    assert.equal(result.overallScore, 7); // every category scored 7
    assert.equal(Object.keys(result.categories).length, CATEGORIES.length);
    assert.equal(result.summary, "A solid design overall.");
  });

  test("clamps an out-of-range score into [0, 10] rather than rejecting it", () => {
    const raw = fullValidRaw();
    raw.categories.color = validCategory(15); // out of range
    const result = validateAnalysis(raw);
    assert.equal(result.categories.color.score, 10);
  });
});

describe("validateAnalysis - missing/invalid categories", () => {
  test("throws IncompleteAnalysisError when a category is entirely missing", () => {
    const raw = fullValidRaw();
    delete raw.categories.spacing;
    assert.throws(() => validateAnalysis(raw), IncompleteAnalysisError);
  });

  test("throws IncompleteAnalysisError when a score is non-numeric", () => {
    const raw = fullValidRaw();
    raw.categories.typography = validCategory("very good"); // not a number
    assert.throws(() => validateAnalysis(raw), IncompleteAnalysisError);
  });

  test("throws IncompleteAnalysisError when categories object itself is missing", () => {
    const raw = fullValidRaw();
    delete raw.categories;
    assert.throws(() => validateAnalysis(raw), IncompleteAnalysisError);
  });

  test("never silently converts a missing category's score into a literal 0", () => {
    // Regression test for the exact bug described in the brief: a missing
    // category must never appear in the output as score: 0.
    const raw = fullValidRaw();
    delete raw.categories.branding;
    try {
      validateAnalysis(raw);
      assert.fail("expected validateAnalysis to throw for a missing category");
    } catch (err) {
      assert.ok(err instanceof IncompleteAnalysisError);
      assert.match(err.message, /branding/);
    }
  });
});

describe("validateAnalysis - malformed top-level input", () => {
  test("throws IncompleteAnalysisError for null input", () => {
    assert.throws(() => validateAnalysis(null), IncompleteAnalysisError);
  });

  test("throws IncompleteAnalysisError for a non-object (e.g. a string)", () => {
    assert.throws(() => validateAnalysis("not an object"), IncompleteAnalysisError);
  });

  test("throws IncompleteAnalysisError for an empty object", () => {
    assert.throws(() => validateAnalysis({}), IncompleteAnalysisError);
  });
});

describe("validateAnalysis - lenient text-field handling", () => {
  test("defaults whatWorks/needsImprovement to empty arrays when malformed, without throwing", () => {
    const raw = fullValidRaw({ whatWorks: "not an array", needsImprovement: null });
    const result = validateAnalysis(raw);
    assert.deepEqual(result.whatWorks, []);
    assert.deepEqual(result.needsImprovement, []);
  });

  test("drops priorityFixes entries missing a problem field", () => {
    const raw = fullValidRaw({
      priorityFixes: [{ priority: "High", why: "x", recommendation: "y" /* no problem */ }],
    });
    const result = validateAnalysis(raw);
    assert.deepEqual(result.priorityFixes, []);
  });

  test("falls back invalid priority levels to Medium instead of rejecting the fix", () => {
    const raw = fullValidRaw({
      priorityFixes: [{ priority: "Extremely Urgent", problem: "p", why: "w", recommendation: "r" }],
    });
    const result = validateAnalysis(raw);
    assert.equal(result.priorityFixes[0].priority, "Medium");
  });
});
