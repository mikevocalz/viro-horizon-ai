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
