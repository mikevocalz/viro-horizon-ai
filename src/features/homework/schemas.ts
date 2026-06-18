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
});

export type HomeworkParseResult = z.infer<typeof homeworkParseSchema>;
