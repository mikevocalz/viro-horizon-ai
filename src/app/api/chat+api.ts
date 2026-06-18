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

export async function POST(request: Request): Promise<Response> {
  const { messages }: { messages: UIMessage[] } = await request.json();

  const result = streamText({
    model: google('gemini-2.5-flash'),
    system: SYSTEM_PROMPT,
    messages: await convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
}
