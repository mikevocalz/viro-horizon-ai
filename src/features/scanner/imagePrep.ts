/**
 * Homework image preprocessing for OCR.
 *
 * Two stages, each with graceful fallback:
 *  1. `preprocessHomeworkImage` — downscale + JPEG-compress (expo-image-manipulator)
 *     for a light, consistent input and the preview thumbnail.
 *  2. `enhanceForOcr` — grayscale + contrast via an offscreen Skia pass, returned as
 *     base64. Grayscale/contrast is what most improves OCR on photographed worksheets,
 *     and `useOCR().forward` accepts a base64 string directly.
 */
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { ImageFormat, Skia } from '@shopify/react-native-skia';

const MAX_WIDTH = 1600;
const JPEG_QUALITY = 0.7;

export async function preprocessHomeworkImage(uri: string): Promise<string> {
  const context = ImageManipulator.manipulate(uri);
  context.resize({ width: MAX_WIDTH });
  const rendered = await context.renderAsync();
  const result = await rendered.saveAsync({ compress: JPEG_QUALITY, format: SaveFormat.JPEG });
  return result.uri;
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
