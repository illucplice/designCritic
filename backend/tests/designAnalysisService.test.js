import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { analyzeDesignImage } from "../services/designAnalysisService.js";
import { CATEGORIES } from "../utils/categories.js";

const fakeImage = { base64: "ZmFrZQ==", mediaType: "image/jpeg" };

function validToolInput() {
  const categories = {};
  for (const { key } of CATEGORIES) {
    categories[key] = { score: 7, strengths: ["ok"], issues: ["ok"], recommendations: ["ok"] };
  }
  return {
    summary: "Solid.",
    categories,
    whatWorks: ["a"],
    needsImprovement: ["b"],
    priorityFixes: [{ priority: "High", problem: "p", why: "w", recommendation: "r" }],
    elements: { detected: ["logo"], notes: "n" },
    finalVerdict: "Good.",
  };
}

function geminiResponse(input, { finishReason = "STOP", rawText } = {}) {
  return {
    text: rawText ?? JSON.stringify(input),
    candidates: [{ finishReason }],
  };
}

/** A fake Gemini client whose models.generateContent is scripted. */
function fakeClient(script) {
  let call = 0;
  return {
    models: {
      generateContent: async () => {
        const step = script[Math.min(call, script.length - 1)];
        call += 1;
        fakeClientCallCount.count += 1;
        if (step.throws) throw step.throws;
        return step.response;
      },
    },
  };
}
const fakeClientCallCount = { count: 0 };

describe("analyzeDesignImage - success path", () => {
  test("returns a validated analysis on the first successful tool call", async () => {
    fakeClientCallCount.count = 0;
    const client = fakeClient([{ response: geminiResponse(validToolInput()) }]);
    const result = await analyzeDesignImage({ image: fakeImage, mode: "Professional" }, client);
    assert.equal(result.overallScore, 7);
    assert.equal(result.mode, "Professional");
    assert.equal(fakeClientCallCount.count, 1);
  });
});

describe("analyzeDesignImage - retry behavior", () => {
  test("retries once on an incomplete response, then succeeds", async () => {
    fakeClientCallCount.count = 0;
    const incomplete = validToolInput();
    delete incomplete.categories.branding; // missing category -> invalid
    const client = fakeClient([
      { response: geminiResponse(incomplete) },
      { response: geminiResponse(validToolInput()) },
    ]);
    const result = await analyzeDesignImage({ image: fakeImage, mode: "Quick" }, client);
    assert.equal(result.overallScore, 7);
    assert.equal(fakeClientCallCount.count, 2, "should have retried exactly once");
  });

  test("gives up after exhausting retries and returns a clean 502 AppError", async () => {
    fakeClientCallCount.count = 0;
    const incomplete = validToolInput();
    delete incomplete.categories.color;
    const client = fakeClient([{ response: geminiResponse(incomplete) }]); // always incomplete
    await assert.rejects(
      () => analyzeDesignImage({ image: fakeImage, mode: "Professional" }, client),
      (err) => err.statusCode === 502
    );
    // default AI_MAX_RETRIES=1 -> 2 total attempts
    assert.equal(fakeClientCallCount.count, 3);
  });

  test("treats a cut-off (max_tokens) response as retryable, not a crash", async () => {
    fakeClientCallCount.count = 0;
    const client = fakeClient([
      { response: geminiResponse(validToolInput(), { finishReason: "MAX_TOKENS" }) },
      { response: geminiResponse(validToolInput()) },
    ]);
    const result = await analyzeDesignImage({ image: fakeImage, mode: "Brutal" }, client);
    assert.equal(result.overallScore, 7);
  });

  test("treats a response with no tool_use block as retryable", async () => {
    fakeClientCallCount.count = 0;
    const client = fakeClient([
      { response: { text: "not json", candidates: [{ finishReason: "STOP" }] } },
      { response: geminiResponse(validToolInput()) },
    ]);
    const result = await analyzeDesignImage({ image: fakeImage, mode: "Professional" }, client);
    assert.equal(result.overallScore, 7);
  });
});

describe("analyzeDesignImage - non-retryable failures", () => {
  test("401 auth error surfaces immediately as a 503, without retrying", async () => {
    fakeClientCallCount.count = 0;
    const authErr = Object.assign(new Error("invalid x-api-key"), { status: 401 });
    const client = fakeClient([{ throws: authErr }]);
    await assert.rejects(
      () => analyzeDesignImage({ image: fakeImage, mode: "Professional" }, client),
      (err) => err.statusCode === 503
    );
    assert.equal(fakeClientCallCount.count, 1, "must not retry on auth failure");
  });

  test("429 rate limit from the AI provider surfaces immediately as 429", async () => {
    fakeClientCallCount.count = 0;
    const rateErr = Object.assign(new Error("rate limited"), { status: 429 });
    const client = fakeClient([{ throws: rateErr }]);
    await assert.rejects(
      () => analyzeDesignImage({ image: fakeImage, mode: "Professional" }, client),
      (err) => err.statusCode === 429
    );
    assert.equal(fakeClientCallCount.count, 1);
  });

  test("a timeout error surfaces as a clean 504 after bounded retries", async () => {
    fakeClientCallCount.count = 0;
    const timeoutErr = Object.assign(new Error("timed out"), { name: "AbortError" });
    const client = fakeClient([{ throws: timeoutErr }]);
    await assert.rejects(
      () => analyzeDesignImage({ image: fakeImage, mode: "Professional" }, client),
      (err) => err.statusCode === 504
    );
  });

  test("never leaks the raw AI/network error message to the user-facing error", async () => {
    fakeClientCallCount.count = 0;
    const secretErr = Object.assign(new Error("Bearer sk-ant-super-secret-leaked-key"), { status: 401 });
    const client = fakeClient([{ throws: secretErr }]);
    try {
      await analyzeDesignImage({ image: fakeImage, mode: "Professional" }, client);
      assert.fail("expected rejection");
    } catch (err) {
      assert.ok(!err.publicMessage.includes("sk-ant"));
    }
  });
});
