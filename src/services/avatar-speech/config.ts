/**
 * Cartesia Sonic 3 + lip-sync config surface.
 *
 * Secrets are NOT hardcoded. The API key is resolved in this order:
 *   1. an explicit runtime value passed to `setCartesiaApiKey()`
 *      (use this when reading from expo-secure-store / Keychain),
 *   2. `process.env.EXPO_PUBLIC_CARTESIA_API_KEY` for dev only — note that any
 *      `EXPO_PUBLIC_*` value is bundled into the JS, so do NOT ship a
 *      production key this way; back it with a server proxy or secure store.
 *
 * voiceId / modelId: stock placeholder until a licensed NYC clone exists.
 * Sonic Professional Voice Clones MUST pin modelId (e.g. `sonic-3-2026-01-12`);
 * only stock voices are safe on `sonic-3-latest`.
 */

export type SonicLanguage = 'en' | 'es' | 'fr' | 'ru' | 'ja' | 'zh';

export interface SonicOutputFormat {
  container: 'raw' | 'wav' | 'mp3';
  encoding: 'pcm_s16le' | 'pcm_f32le';
  sample_rate: number;
}

export interface AvatarSpeechConfig {
  /** Cartesia voice id. TODO: replace with licensed NYC clone, pin modelId. */
  voiceId: string;
  /** Pinned model id for clones (e.g. `sonic-3-2026-01-12`); stock voices may use `sonic-3-latest`. */
  modelId: string;
  /** Default language for utterances (per-call `speak({language})` overrides). */
  language: SonicLanguage;
  /** Raw PCM in s16le at 22050 Hz is the cheapest to wrap into WAV; bump as needed. */
  outputFormat: SonicOutputFormat;
  /** Spring smoothing half-life for morph motion (ms). Engine default 55; 50 is a touch crisper. */
  smoothingHalfLifeMs: number;
  /** Render+display latency comp (ms). Engine default 45. */
  lookaheadMs: number;
  /** Idle micro-motion (blink/breath) on by default. */
  idle: boolean;
  /** Cartesia WebSocket endpoint. */
  wsUrl: string;
}

export const DEFAULT_CONFIG: AvatarSpeechConfig = {
  // TODO: replace with licensed NYC clone, pin modelId
  voiceId: 'a0e99841-438c-4a64-b679-ae501e7d6091',
  modelId: 'sonic-3-latest',
  language: 'en',
  outputFormat: { container: 'raw', encoding: 'pcm_s16le', sample_rate: 22050 },
  smoothingHalfLifeMs: 50,
  lookaheadMs: 45,
  idle: true,
  wsUrl: 'wss://api.cartesia.ai/tts/websocket',
};

let runtimeApiKey: string | null = null;

/** Inject an API key from secure storage at app boot. */
export function setCartesiaApiKey(key: string | null): void {
  runtimeApiKey = key && key.length > 0 ? key : null;
}

/** Resolve the API key; throws if neither runtime nor env provides one. */
export function getCartesiaApiKey(): string {
  if (runtimeApiKey) return runtimeApiKey;
  const envKey = process.env.EXPO_PUBLIC_CARTESIA_API_KEY;
  if (envKey && envKey.length > 0) return envKey;
  throw new Error(
    'Cartesia API key missing. Call setCartesiaApiKey() at boot or set EXPO_PUBLIC_CARTESIA_API_KEY (dev only).'
  );
}
