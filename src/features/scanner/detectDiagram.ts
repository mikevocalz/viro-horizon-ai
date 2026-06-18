/**
 * On-device diagram localization from OCR boxes.
 *
 * Generic object detection (COCO) can't recognize "a worksheet illustration", so
 * we infer the picture region from the text we already detected: the largest
 * text-free band (above or below the text block) is almost always the diagram on
 * a homework page. Zero extra models, fully offline.
 *
 * Returns a normalized (0..1) box, or null when there's no clear illustration.
 */
import type { OCRDetection } from 'react-native-executorch';

import type { DiagramBox } from '@/features/homework/schemas';

const MIN_BAND_FRACTION = 0.22; // a band must be ≥22% of page height to count

export function detectDiagramBox(
  detections: OCRDetection[],
  width: number,
  height: number,
): DiagramBox | null {
  if (!width || !height || detections.length === 0) {
    return null;
  }

  const topOfText = Math.min(...detections.map((d) => d.bbox.y1));
  const bottomOfText = Math.max(...detections.map((d) => d.bbox.y2));

  const topBand = Math.max(0, topOfText);
  const bottomBand = Math.max(0, height - bottomOfText);
  const minBand = height * MIN_BAND_FRACTION;

  if (topBand >= bottomBand && topBand >= minBand) {
    return { x: 0, y: 0, width: 1, height: clamp01(topOfText / height) };
  }
  if (bottomBand > topBand && bottomBand >= minBand) {
    return { x: 0, y: clamp01(bottomOfText / height), width: 1, height: clamp01(bottomBand / height) };
  }
  return null;
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}
