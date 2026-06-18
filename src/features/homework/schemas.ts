/**
 * Zod schemas for LLM-structured homework parsing. Shared by the parse API route
 * (`generateObject`) and the client for runtime validation of responses.
 */
import { z } from 'zod';

export const homeworkParseSchema = z.object({
  subject: z.enum(['science', 'math', 'history', 'language', 'other']),
  topic: z.string().describe('Short human-readable topic, e.g. "Solar system"'),
  keywords: z
    .array(z.string())
    .describe('Lowercase keywords describing the content, used for XR matching'),
  questions: z
    .array(
      z.object({
        prompt: z.string().describe('The question rewritten clearly'),
        rawText: z.string().optional(),
      }),
    )
    .describe('Each distinct question detected in the homework'),
  diagramBox: z
    .object({
      x: z.number().describe('Left, normalized 0..1'),
      y: z.number().describe('Top, normalized 0..1'),
      width: z.number().describe('Width, normalized 0..1'),
      height: z.number().describe('Height, normalized 0..1'),
    })
    .nullable()
    .describe(
      'Bounding box of the main illustration/diagram (e.g. a solar system picture) if one exists, normalized 0..1; null if there is no picture',
    ),
});

export type HomeworkParseResult = z.infer<typeof homeworkParseSchema>;
export type DiagramBox = NonNullable<HomeworkParseResult['diagramBox']>;

