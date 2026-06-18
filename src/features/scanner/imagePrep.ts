/**
 * Homework image preprocessing for OCR + 3D generation.
 *
 *  1. `preprocessHomeworkImage` — downscale + JPEG-compress (expo-image-manipulator);
 *     returns uri + pixel dims (dims needed to crop the diagram).
 *  2. `enhanceForOcr` — grayscale + contrast via an offscreen Skia pass, as base64
 *     (what most improves OCR; `useOCR().forward` accepts base64).
 *  3. `cropDiagram` — crops the detected illustration (e.g. a solar-system picture)
 *     so it can be shown in XR and used as Rodin image-to-3D input.
 *
 * Each stage degrades gracefully (callers fall back to the prior artifact).
 */
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { ImageFormat, Skia } from '@shopify/react-native-skia';

import type { DiagramBox } from '@/features/homework/schemas';

const MAX_WIDTH = 1600;
const JPEG_QUALITY = 0.7;

export type ProcessedImage = { uri: string; width: number; height: number };

export async function preprocessHomeworkImage(uri: string): Promise<ProcessedImage> {
  const context = ImageManipulator.manipulate(uri);
  context.resize({ width: MAX_WIDTH });
  const rendered = await context.renderAsync();
  const result = await rendered.saveAsync({ compress: JPEG_QUALITY, format: SaveFormat.JPEG });
  return { uri: result.uri, width: result.width, height: result.height };
}

// 4x5 color matrix: luminance grayscale (Rec. 601) scaled by a 1.4 contrast factor,
// with a -0.2 bias to deepen ink vs. paper. Alpha untouched.
const GRAYSCALE_CONTRAST: number[] = [
  0.4186, 0.8218, 0.1596, 0, -0.2,
  0.4186, 0.8218, 0.1596, 0, -0.2,
  0.4186, 0.8218, 0.1596, 0, -0.2,
  0, 0, 0, 1, 0,
];

/** Returns an enhanced JPEG as base64, or null if the Skia pass is unavailable. */
export async function enhanceForOcr(uri: string): Promise<string | null> {
  const data = await Skia.Data.fromURI(uri);
  const image = Skia.Image.MakeImageFromEncoded(data);
  if (!image) {
    return null;
  }
  const surface = Skia.Surface.MakeOffscreen(image.width(), image.height());
  if (!surface) {
    return null;
  }
  const paint = Skia.Paint();
  paint.setColorFilter(Skia.ColorFilter.MakeMatrix(GRAYSCALE_CONTRAST));
  surface.getCanvas().drawImage(image, 0, 0, paint);
  return surface.makeImageSnapshot().encodeToBase64(ImageFormat.JPEG, 85);
}

// Coarse grid used to locate the illustration (content minus text).
export const CONTENT_COLS = 40;
export const CONTENT_ROWS = 56;

/**
 * Downscales the image to a coarse grid and returns a per-cell "non-paper" score
 * (0 = white paper, 1 = fully inked/colored). Combined with the OCR text boxes,
 * this lets us find the picture region (content that isn't text) even inline —
 * and tell a real illustration apart from blank margins. Null if Skia is absent.
 */
export async function contentGrid(uri: string): Promise<number[] | null> {
  const data = await Skia.Data.fromURI(uri);
  const image = Skia.Image.MakeImageFromEncoded(data);
  if (!image) {
    return null;
  }
  const iw = image.width();
  const ih = image.height();
  if (!iw || !ih) {
    return null;
  }
  const surface = Skia.Surface.MakeOffscreen(CONTENT_COLS, CONTENT_ROWS);
  if (!surface) {
    return null;
  }
  const canvas = surface.getCanvas();
  canvas.scale(CONTENT_COLS / iw, CONTENT_ROWS / ih);
  canvas.drawImage(image, 0, 0);
  const px = surface.makeImageSnapshot().readPixels();
  if (!px) {
    return null;
  }
  const isFloat = px instanceof Float32Array;
  const cells = CONTENT_COLS * CONTENT_ROWS;
  const grid = new Array<number>(cells);
  for (let i = 0; i < cells; i++) {
    const o = i * 4;
    const r = isFloat ? px[o] : px[o] / 255;
    const g = isFloat ? px[o + 1] : px[o + 1] / 255;
    const b = isFloat ? px[o + 2] : px[o + 2] / 255;
    grid[i] = 1 - Math.min(r, g, b);
  }
  return grid;
}

/** Crops the normalized diagram box out of an image. Returns the crop uri or null. */
export async function cropDiagram(
  image: ProcessedImage,
  box: DiagramBox,
): Promise<string | null> {
  const { uri, width, height } = image;
  if (!width || !height) {
    return null;
  }
  const originX = Math.max(0, Math.round(box.x * width));
  const originY = Math.max(0, Math.round(box.y * height));
  const cropWidth = Math.min(width - originX, Math.round(box.width * width));
  const cropHeight = Math.min(height - originY, Math.round(box.height * height));
  if (cropWidth <= 8 || cropHeight <= 8) {
    return null;
  }
  const context = ImageManipulator.manipulate(uri);
  context.crop({ originX, originY, width: cropWidth, height: cropHeight });
  const rendered = await context.renderAsync();
  const result = await rendered.saveAsync({ compress: 0.85, format: SaveFormat.JPEG });
  return result.uri;
}
