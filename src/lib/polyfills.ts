/**
 * Polyfills required by the Vercel AI SDK on React Native.
 *
 * The streaming transport relies on `structuredClone` and the
 * `TextEncoderStream` / `TextDecoderStream` web APIs, which Hermes/RN do not
 * ship. Import this module once, before any AI SDK usage (see the root layout).
 */
import structuredClonePolyfill from '@ungap/structured-clone';
import { TextDecoderStream, TextEncoderStream } from '@stardazed/streams-text-encoding';

const globals = globalThis as unknown as Record<string, unknown>;

if (typeof globals.structuredClone !== 'function') {
  globals.structuredClone = structuredClonePolyfill;
}
if (typeof globals.TextEncoderStream === 'undefined') {
  globals.TextEncoderStream = TextEncoderStream;
}
if (typeof globals.TextDecoderStream === 'undefined') {
  globals.TextDecoderStream = TextDecoderStream;
}
