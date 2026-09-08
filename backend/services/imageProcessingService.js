import sharp from "sharp";
import { config } from "../config/index.js";
import { AppError } from "../utils/AppError.js";

/**
 * Decodes and validates the uploaded buffer, then resizes/re-encodes it so
 * we never send an oversized payload to the AI model. Also guards against
 * corrupted files or files whose real bytes don't match their claimed
 * mime type (sharp will throw if it can't decode the image).
 */
export async function prepareImageForAnalysis(buffer) {
  let metadata;
  try {
    metadata = await sharp(buffer).metadata();
  } catch (err) {
    throw new AppError(
      422,
      "That file doesn't look like a valid image. It may be corrupted — please try a different PNG, JPG, or WEBP."
    );
  }

  if (!metadata.width || !metadata.height) {
    throw new AppError(422, "Couldn't read image dimensions. Please try a different file.");
  }

  if (metadata.width < 100 || metadata.height < 100) {
    throw new AppError(
      422,
      "This image is too small to critique meaningfully. Please upload a design at least 100x100px."
    );
  }

  const megapixels = (metadata.width * metadata.height) / 1_000_000;
  if (megapixels > config.maxImageMegapixels) {
    throw new AppError(
      422,
      `This image's resolution (${Math.round(megapixels)}MP) is too large to process safely. ` +
        `Please upload something under ${config.maxImageMegapixels}MP.`
    );
  }

  const longestSide = Math.max(metadata.width, metadata.height);
  let pipeline = sharp(buffer, { limitInputPixels: config.maxImageMegapixels * 1_000_000 }).rotate(); // auto-orient using EXIF, then strip it

  if (longestSide > config.maxImageDimension) {
    pipeline = pipeline.resize({
      width: metadata.width >= metadata.height ? config.maxImageDimension : null,
      height: metadata.height > metadata.width ? config.maxImageDimension : null,
      fit: "inside",
      withoutEnlargement: true,
    });
  }

  const optimized = await pipeline
    .jpeg({ quality: config.jpegQuality, mozjpeg: true })
    .toBuffer({ resolveWithObject: true });

  return {
    base64: optimized.data.toString("base64"),
    mediaType: "image/jpeg",
    width: optimized.info.width,
    height: optimized.info.height,
    originalWidth: metadata.width,
    originalHeight: metadata.height,
    originalFormat: metadata.format,
  };
}
