/**
 * Online tutor endpoint — the fallback used when on-device inference is
 * unavailable. Streams a Google Gemini response back to the `useChat` client
 * using the homework tutor system prompt, augmented with the scanned homework
 * context the client sends in the request body.
 *
 * Requires `GOOGLE_GENERATIVE_AI_API_KEY` in the server environment (read
 * automatically by `@ai-sdk/google`).
 */
import { google } from '@ai-sdk/google';
import { convertToModelMessages, streamText, type UIMessage } from 'ai';

import { TUTOR_SYSTEM_PROMPT } from '@/features/tutor/tutorPrompts';

/** Override via the `GOOGLE_CHAT_MODEL` server env var; defaults to Gemini 3 Pro. */
const MODEL_ID = process.env.GOOGLE_CHAT_MODEL ?? 'gemini-3-pro-preview';

export async function POST(request: Request): Promise<Response> {
  const { messages, homeworkContext } = (await request.json()) as {
    messages: UIMessage[];
    homeworkContext?: string;
  };

  const system = homeworkContext
    ? `${TUTOR_SYSTEM_PROMPT}\n\n${homeworkContext}`
    : TUTOR_SYSTEM_PROMPT;

  const result = streamText({
    model: google(MODEL_ID),
    system,
    messages: await convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
}
