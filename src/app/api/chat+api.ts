/**
 * Online chat endpoint — the fallback used when on-device inference is
 * unavailable. Streams a Google Gemini response back to the `useChat` client.
 *
 * Requires `GOOGLE_GENERATIVE_AI_API_KEY` in the server environment (read
 * automatically by `@ai-sdk/google`).
 */
import { google } from '@ai-sdk/google';
import { convertToModelMessages, streamText, type UIMessage } from 'ai';

const SYSTEM_PROMPT =
  'You are a helpful, concise assistant. Keep answers short unless asked to elaborate.';

/** Override via the `GOOGLE_CHAT_MODEL` server env var; defaults to Gemini 3 Pro. */
const MODEL_ID = process.env.GOOGLE_CHAT_MODEL ?? 'gemini-3-pro-preview';

export async function POST(request: Request): Promise<Response> {
  const { messages }: { messages: UIMessage[] } = await request.json();

  const result = streamText({
    model: google(MODEL_ID),
    system: SYSTEM_PROMPT,
    messages: await convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
}
