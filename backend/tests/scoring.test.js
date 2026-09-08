import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { computeWeightedScore, clampScore } from "../utils/scoring.js";
import { CATEGORIES } from "../utils/categories.js";

function fullCategorySet(score) {
  const categories = {};
  for (const { key } of CATEGORIES) categories[key] = { score };
  return categories;
}

describe("clampScore", () => {
  test("clamps values above 10 down to 10", () => {
    assert.equal(clampScore(15), 10);
  });

  test("clamps negative values up to 0", () => {
    assert.equal(clampScore(-5), 0);
  });

  test("rounds to one decimal place", () => {
    assert.equal(clampScore(7.777), 7.8);
  });

  test("returns null for non-numeric input", () => {
    assert.equal(clampScore("great design"), null);
    assert.equal(clampScore(undefined), null);
    assert.equal(clampScore(null), null);
    assert.equal(clampScore(NaN), null);
  });

  test("rejects booleans even though Number(true) is 1", () => {
    assert.equal(clampScore(true), null);
    assert.equal(clampScore(false), null);
  });

  test("accepts valid in-range numbers unchanged", () => {
    assert.equal(clampScore(7), 7);
    assert.equal(clampScore(0), 0);
    assert.equal(clampScore(10), 10);
  });
});

describe("computeWeightedScore", () => {
  test("computes correct weighted average when every category scores the same", () => {
    // If every category scores exactly 8, the weighted average must also be 8
    // regardless of the individual weights (they sum to 1).
    assert.equal(computeWeightedScore(fullCategorySet(8)), 8);
  });

  test("computes a genuine weighted average across differing scores", () => {
    const categories = fullCategorySet(5);
    categories.visualHierarchy = { score: 10 }; // weight 0.15
    categories.communication = { score: 0 }; // weight 0.15
    // These two cancel out around the 5 baseline, so overall should stay ~5.
    const result = computeWeightedScore(categories);
    assert.ok(result >= 4.5 && result <= 5.5, `expected ~5, got ${result}`);
  });

  test("a missing category is excluded from the average, not treated as 0", () => {
    const categories = fullCategorySet(8);
    delete categories.spacing; // simulate a missing category entirely
    // If missing categories were silently treated as 0, this would pull the
    // average down. It must not.
    assert.equal(computeWeightedScore(categories), 8);
  });

  test("a category with a null score is excluded, never drags the score to 0", () => {
    const categories = fullCategorySet(9);
    categories.branding = { score: null };
    assert.equal(computeWeightedScore(categories), 9);
  });

  test("returns 0 when there are no valid categories at all", () => {
    assert.equal(computeWeightedScore({}), 0);
  });

  test("rounds the final result to one decimal place", () => {
    const categories = fullCategorySet(7);
    categories.typography = { score: 8 };
    const result = computeWeightedScore(categories);
    assert.equal(result, Math.round(result * 10) / 10);
  });
});
