import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";

// Force a tiny, deterministic rate limit + no AI key for this test file,
// and load the app AFTER setting env so config/index.js picks it up.
process.env.GEMINI_API_KEY = "";
process.env.RATE_LIMIT_MAX_REQUESTS = "20";
process.env.RATE_LIMIT_WINDOW_MINUTES = "1";
process.env.CORS_ORIGIN = "http://localhost:5173";
process.env.MAX_UPLOAD_MB = "5";

const { default: express } = await import("express");
const { default: cors } = await import("cors");
const analyzeRoutes = (await import("../routes/analyze.js")).default;
const { errorHandler, notFoundHandler } = await import("../middleware/errorHandler.js");
const { config } = await import("../config/index.js");

function buildApp() {
  const app = express();
  app.use(cors({ origin: config.corsOrigins, methods: ["GET", "POST"] }));
  app.use(express.json({ limit: "1mb" }));
  app.use("/api", analyzeRoutes);
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}

let server;
let baseUrl;

before(async () => {
  const app = buildApp();
  await new Promise((resolve) => {
    server = app.listen(0, () => {
      baseUrl = `http://localhost:${server.address().port}`;
      resolve();
    });
  });
});

after(() => {
  server.close();
});

async function testImageBuffer(width = 800, height = 600) {
  return sharp({ create: { width, height, channels: 3, background: { r: 10, g: 100, b: 200 } } })
    .jpeg()
    .toBuffer();
}

describe("GET /api/health", () => {
  test("reports AI as not configured and exposes maxUploadMb", async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    const body = await res.json();
    assert.equal(res.status, 200);
    assert.equal(body.aiConfigured, false);
    assert.equal(body.maxUploadMb, 5);
    assert.ok(Array.isArray(body.acceptedMimeTypes));
  });
});

describe("POST /api/analyze-design - validation errors", () => {
  test("400 when no image is attached", async () => {
    const res = await fetch(`${baseUrl}/api/analyze-design`, { method: "POST", body: new FormData() });
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.error, true);
  });

  test("415 for an unsupported file type", async () => {
    const fd = new FormData();
    fd.append("image", new Blob([new Uint8Array(50)], { type: "application/pdf" }), "file.pdf");
    const res = await fetch(`${baseUrl}/api/analyze-design`, { method: "POST", body: fd });
    assert.equal(res.status, 415);
  });

  test("413 for a file over the configured max size", async () => {
    const fd = new FormData();
    fd.append("image", new Blob([new Uint8Array(6 * 1024 * 1024)], { type: "image/png" }), "big.png");
    const res = await fetch(`${baseUrl}/api/analyze-design`, { method: "POST", body: fd });
    assert.equal(res.status, 413);
    const body = await res.json();
    assert.match(body.message, /5MB/);
  });

  test("422 for a corrupted image", async () => {
    const fd = new FormData();
    fd.append("image", new Blob([new Uint8Array(100).fill(9)], { type: "image/png" }), "corrupt.png");
    const res = await fetch(`${baseUrl}/api/analyze-design`, { method: "POST", body: fd });
    assert.equal(res.status, 422);
  });
});

describe("POST /api/analyze-design - AI not configured", () => {
  test("503 with a clean, safe error message for a valid image", async () => {
    const buf = await testImageBuffer();
    const fd = new FormData();
    fd.append("image", new Blob([buf], { type: "image/jpeg" }), "design.jpg");
    const res = await fetch(`${baseUrl}/api/analyze-design`, { method: "POST", body: fd });
    assert.equal(res.status, 503);
    const body = await res.json();
    assert.equal(body.error, true);
    assert.ok(body.message.length > 0);
    assert.ok(!body.stack, "response must never include a stack trace");
  });
});

describe("Rate limiting", () => {
  test("blocks requests once the configured limit is exceeded, even counting failed requests", async () => {
    const buf = await testImageBuffer();
    const makeRequest = async () => {
      const fd = new FormData();
      fd.append("image", new Blob([buf], { type: "image/jpeg" }), "design.jpg");
      return fetch(`${baseUrl}/api/analyze-design`, { method: "POST", body: fd });
    };
    // Earlier describes in this file already spent a few requests against
    // this same in-process rate limiter (it's a module-level singleton), so
    // send a generous burst well past the configured max rather than
    // assuming an exact remaining count.
    const burst = config.rateLimitMax + 5;
    const results = [];
    for (let i = 0; i < burst; i++) {
      const res = await makeRequest();
      results.push(res.status);
    }
    assert.ok(results.includes(429), `expected at least one 429 among: ${results.join(",")}`);
    // once limited, it should stay limited for the rest of this burst
    const limitedIndex = results.indexOf(429);
    assert.ok(results.slice(limitedIndex).every((s) => s === 429));
  });
});

describe("Error responses never leak internals", () => {
  test("404 for unknown routes returns the standard safe JSON shape", async () => {
    const res = await fetch(`${baseUrl}/api/does-not-exist`);
    assert.equal(res.status, 404);
    const body = await res.json();
    assert.equal(body.error, true);
    assert.ok(!body.stack);
  });
});
