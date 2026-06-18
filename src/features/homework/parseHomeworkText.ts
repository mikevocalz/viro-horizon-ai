/**
 * Local, on-device parser: turns OCR-extracted homework text into the same
 * `HomeworkParseResult` shape the LLM parse route returns — no network needed.
 *
 * Heuristic: match a keyword bank for subject/topic/keywords, and split the text
 * into questions (lines ending in '?' or numbered lines, else the whole text).
 */
import type { HomeworkParseResult } from './schemas';

const SCIENCE_KEYWORDS = [
  'solar system',
  'planet',
  'planets',
  'inner planets',
  'outer planets',
  'orbit',
  'orbital',
  'rotation',
  'rocky planets',
  'gas giants',
  'astronomy',
  'mercury',
  'venus',
  'earth',
  'mars',
  'jupiter',
  'saturn',
  'uranus',
  'neptune',
  'sun',
];

const MATH_KEYWORDS = ['triangle', 'angle', 'equation', 'fraction', 'geometry', 'algebra'];

function extractQuestions(text: string): { prompt: string; rawText?: string }[] {
  const lines = text
    .split(/\r?\n|(?<=[?])\s+/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const candidates = lines.filter((l) => l.includes('?') || /^\d+[.)]/.test(l));
  const picked = candidates.length > 0 ? candidates : lines.slice(0, 3);

  if (picked.length === 0) {
    return [{ prompt: text.trim() || 'Homework question', rawText: text }];
  }
  return picked.map((l) => ({ prompt: l.replace(/^\d+[.)]\s*/, ''), rawText: l }));
}

export function parseHomeworkText(text: string): HomeworkParseResult {
  const haystack = text.toLowerCase();
  const keywords = SCIENCE_KEYWORDS.filter((k) => haystack.includes(k));
  const mathHits = MATH_KEYWORDS.filter((k) => haystack.includes(k));

  const subject: HomeworkParseResult['subject'] =
    keywords.length > 0 ? 'science' : mathHits.length > 0 ? 'math' : 'other';

  const topic =
    keywords.length > 0
      ? 'Solar system'
      : (text.split(/\r?\n/).map((l) => l.trim()).find((l) => l.length > 0) ?? 'Homework');

  return {
    subject,
    topic,
    keywords: keywords.length > 0 ? keywords : mathHits,
    questions: extractQuestions(text),
    // On-device OCR has no diagram localization; the whole page is used as the
    // XR reference instead (see the scanner).
    diagramBox: null,
  };
}
