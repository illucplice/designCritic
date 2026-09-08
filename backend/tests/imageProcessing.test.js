import { test, describe } from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import { prepareImageForAnalysis } from "../services/imageProcessingService.js";
import { AppError } from "../utils/AppError.js";

async function makeTestImage({ width = 800, height = 600, format = "png" } = {}) {
  const img = sharp({
    create: { width, height, channels: 3, background: { r: 80, g: 120, b: 200 } },
  });
  if (format === "jpeg") return img.jpeg().toBuffer();
  if (format === "webp") return img.webp().toBuffer();
  return img.png().toBuffer();
}

describe("prepareImageForAnalysis - valid images", () => {
  test("accepts a valid PNG and returns base64 JPEG output", async () => {
    const buf = await makeTestImage({ format: "png" });
    const result = await prepareImageForAnalysis(buf);
    assert.equal(result.mediaType, "image/jpeg");
    assert.ok(result.base64.length > 0);
    assert.equal(result.width, 800);
    assert.equal(result.height, 600);
  });

  test("accepts a valid JPEG", async () => {
    const buf = await makeTestImage({ format: "jpeg" });
    const result = await prepareImageForAnalysis(buf);
    assert.equal(result.originalFormat, "jpeg");
  });

  test("accepts a valid WEBP", async () => {
    const buf = await makeTestImage({ format: "webp" });
    const result = await prepareImageForAnalysis(buf);
    assert.equal(result.originalFormat, "webp");
  });

  test("downscales an oversized image rather than sending it at full resolution", async () => {
    const buf = await makeTestImage({ width: 4000, height: 3000 });
    const result = await prepareImageForAnalysis(buf);
    assert.ok(Math.max(result.width, result.height) <= 1568);
  });
});

describe("prepareImageForAnalysis - rejected input", () => {
  test("rejects a corrupted/unreadable buffer", async () => {
    await assert.rejects(
      () => prepareImageForAnalysis(Buffer.from("this is not an image at all")),
      (err) => err instanceof AppError && err.statusCode === 422
    );
  });

  test("rejects a truncated/garbage image buffer", async () => {
    const random = Buffer.from(Array.from({ length: 200 }, () => Math.floor(Math.random() * 256)));
    await assert.rejects(
      () => prepareImageForAnalysis(random),
      (err) => err instanceof AppError
    );
  });

  test("rejects an image below the minimum dimensions", async () => {
    const buf = await makeTestImage({ width: 50, height: 50 });
    await assert.rejects(
      () => prepareImageForAnalysis(buf),
      (err) => err instanceof AppError && /too small/.test(err.publicMessage)
    );
  });

  test("error messages never leak filesystem paths or internal details", async () => {
    try {
      await prepareImageForAnalysis(Buffer.from("garbage"));
      assert.fail("expected rejection");
    } catch (err) {
      assert.ok(!err.publicMessage.includes("/"));
      assert.ok(!err.publicMessage.toLowerCase().includes("enoent"));
    }
  });
});
