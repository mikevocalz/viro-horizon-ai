/**
 * Normalizes a captured homework photo before OCR / upload: downscale to a sane
 * width and re-encode as compressed JPEG. Smaller, consistent input improves OCR
 * reliability and keeps the Gemini fallback upload light. EXIF orientation is
 * applied by the native encoder.
 */
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

const MAX_WIDTH = 1600;
const JPEG_QUALITY = 0.7;

export async function preprocessHomeworkImage(uri: string): Promise<string> {
  const context = ImageManipulator.manipulate(uri);
  context.resize({ width: MAX_WIDTH });
  const rendered = await context.renderAsync();
  const result = await rendered.saveAsync({ compress: JPEG_QUALITY, format: SaveFormat.JPEG });
  return result.uri;
}
