/**
 * Cartesia Sonic 3 wire-protocol adapter.
 *
 * One file. One place to fix on first live connect if the message `type` or
 * field names differ from the doc shape:
 *
 *   { type: "phoneme_timestamps",
 *     phoneme_timestamps: { phonemes:[...], start:[...], end:[...] } }
 *
 * Re-exports the engine-side types from react-native-viseme-xr so callers
 * don't import them in two places.
 */

import type {
  Sonic3Message,
  Sonic3PhonemeTimestamps,
} from 'react-native-viseme-xr';

export type { Sonic3Message, Sonic3PhonemeTimestamps };

/** Cartesia "chunk" message carrying base64 audio. */
export interface SonicChunkMessage {
  type: 'chunk';
  data: string; // base64
  context_id?: string;
  done?: boolean;
}

/** Cartesia "done" message ending a context. */
export interface SonicDoneMessage {
  type: 'done';
  context_id?: string;
}

/** Cartesia "error" message. */
export interface SonicErrorMessage {
  type: 'error';
  error: string;
  context_id?: string;
}

export type SonicAnyMessage =
  | Sonic3Message
  | SonicChunkMessage
  | SonicDoneMessage
  | SonicErrorMessage;

/**
 * Parse a raw WS frame to a typed Sonic message. Returns null on malformed
 * JSON so the caller can log a single raw frame for adapter verification.
 */
export function parseSonicMessage(raw: string): SonicAnyMessage | null {
  try {
    const obj = JSON.parse(raw);
    if (typeof obj !== 'object' || obj === null || typeof obj.type !== 'string') {
      return null;
    }
    return obj as SonicAnyMessage;
  } catch {
    return null;
  }
}

export function isPhonemeMessage(m: SonicAnyMessage): m is Sonic3Message {
  return m.type === 'phoneme_timestamps' && 'phoneme_timestamps' in m;
}

export function isChunkMessage(m: SonicAnyMessage): m is SonicChunkMessage {
  return m.type === 'chunk' && typeof (m as SonicChunkMessage).data === 'string';
}

export function isDoneMessage(m: SonicAnyMessage): m is SonicDoneMessage {
  return m.type === 'done';
}

export function isErrorMessage(m: SonicAnyMessage): m is SonicErrorMessage {
  return m.type === 'error';
}
