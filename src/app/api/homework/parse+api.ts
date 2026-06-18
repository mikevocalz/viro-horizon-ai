/**
 * Homework parsing — the tutor LLM (Gemini) reads the scanned image and returns
 * structured subject/topic/keywords/questions. This is the "understanding" step;
 * it does not solve the homework.
 */
import { google } from '@ai-sdk/google';
import { generateObject } from 'ai';

import { homeworkParseSchema } from '@/features/homework/schemas';

export async function POST(request: Request): Promise<Response> {
  const { imageBase64, mimeType } = (await request.json()) as {
    imageBase64: string;
    mimeType?: string;
  };

  const { object } = await generateObject({
    model: google('gemini-3-pro-preview'),
    schema: homeworkParseSchema,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'Extract the homework subject, a short topic, lowercase keywords, and each distinct question from this homework photo. If the page contains a picture/diagram/illustration (e.g. a solar system image), return its bounding box as `diagramBox` normalized 0..1; otherwise set diagramBox to null. Do not answer the questions.',
          },
          { type: 'image', image: `data:${mimeType ?? 'image/jpeg'};base64,${imageBase64}` },
        ],
      },
    ],
  });

  return Response.json(object);
}
