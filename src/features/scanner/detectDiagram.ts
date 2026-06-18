/**
 * On-device diagram localization.
 *
 * Generic object/semantic models (COCO/Pascal) can't recognize "a worksheet
 * illustration", and no document-layout model ships in our stack. So we combine
 * two on-device signals we already have:
 *   - a Skia content grid (where there is ink/color vs. blank paper), and
 *   - the OCR text boxes (where there is text),
 * and take the largest connected region of **content that isn't text** — that's
 * the picture, even when it's inline beside the questions. Falls back to the
 * largest text-free band when no content grid is available.
 *
 * Returns a normalized (0..1) box, or null when there's no clear illustration.
 */
import type { OCRDetection } from 'react-native-executorch';

import type { DiagramBox } from '@/features/homework/schemas';

const MIN_BAND_FRACTION = 0.22;
const CONTENT_THRESHOLD = 0.22; // non-paper score for a cell to count as content
const MIN_AREA_FRACTION = 0.05; // picture blob must cover ≥5% of the page
const MAX_AREA_FRACTION = 0.9; // …and not be basically the whole page
const MIN_FILL_RATIO = 0.4; // blob must reasonably fill its bounding box

type Grid = { values: number[]; cols: number; rows: number };

export function detectDiagramBox(
  detections: OCRDetection[],
  width: number,
  height: number,
  grid?: Grid,
): DiagramBox | null {
  if (!width || !height) {
    return null;
  }
  if (grid && grid.values.length === grid.cols * grid.rows) {
    const fromContent = detectFromContent(detections, width, height, grid);
    if (fromContent) {
      return fromContent;
    }
  }
  return detectFromBands(detections, height);
}

function detectFromContent(
  detections: OCRDetection[],
  width: number,
  height: number,
  grid: Grid,
): DiagramBox | null {
  const { values, cols, rows } = grid;
  const total = cols * rows;

  // Mark cells covered by text.
  const isText = new Array<boolean>(total).fill(false);
  for (const d of detections) {
    const c0 = clampInt((d.bbox.x1 / width) * cols, 0, cols - 1);
    const c1 = clampInt((d.bbox.x2 / width) * cols, 0, cols - 1);
    const r0 = clampInt((d.bbox.y1 / height) * rows, 0, rows - 1);
    const r1 = clampInt((d.bbox.y2 / height) * rows, 0, rows - 1);
    for (let r = r0; r <= r1; r++) {
      for (let c = c0; c <= c1; c++) {
        isText[r * cols + c] = true;
      }
    }
  }

  // Picture cells = content that isn't text.
  const isPic = new Array<boolean>(total);
  for (let i = 0; i < total; i++) {
    isPic[i] = values[i] >= CONTENT_THRESHOLD && !isText[i];
  }

  // Largest 4-connected component of picture cells.
  const seen = new Array<boolean>(total).fill(false);
  let best = { count: 0, r0: 0, r1: 0, c0: 0, c1: 0 };
  const queue: number[] = [];
  for (let start = 0; start < total; start++) {
    if (!isPic[start] || seen[start]) {
      continue;
    }
    queue.length = 0;
    queue.push(start);
    seen[start] = true;
    let count = 0;
    let minR = rows;
    let maxR = 0;
    let minC = cols;
    let maxC = 0;
    while (queue.length > 0) {
      const idx = queue.pop() as number;
      const r = Math.floor(idx / cols);
      const c = idx % cols;
      count++;
      minR = Math.min(minR, r);
      maxR = Math.max(maxR, r);
      minC = Math.min(minC, c);
      maxC = Math.max(maxC, c);
      const neighbors = [idx - 1, idx + 1, idx - cols, idx + cols];
      if (c === 0) neighbors[0] = -1;
      if (c === cols - 1) neighbors[1] = -1;
      for (const n of neighbors) {
        if (n >= 0 && n < total && isPic[n] && !seen[n]) {
          seen[n] = true;
          queue.push(n);
        }
      }
    }
    if (count > best.count) {
      best = { count, r0: minR, r1: maxR, c0: minC, c1: maxC };
    }
  }

  if (best.count === 0) {
    return null;
  }
  const boxCells = (best.r1 - best.r0 + 1) * (best.c1 - best.c0 + 1);
  const areaFraction = best.count / total;
  const fillRatio = best.count / boxCells;
  if (
    areaFraction < MIN_AREA_FRACTION ||
    areaFraction > MAX_AREA_FRACTION ||
    fillRatio < MIN_FILL_RATIO
  ) {
    return null;
  }
  return {
    x: best.c0 / cols,
    y: best.r0 / rows,
    width: (best.c1 - best.c0 + 1) / cols,
    height: (best.r1 - best.r0 + 1) / rows,
  };
}

function detectFromBands(detections: OCRDetection[], height: number): DiagramBox | null {
  if (detections.length === 0) {
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

function clampInt(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, Math.round(n)));
}
