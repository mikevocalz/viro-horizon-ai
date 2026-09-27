/**
 * SonicVoiceService — Cartesia Sonic 3 streaming WebSocket client.
 *
 * Owns the socket lifecycle, sends `tts` requests, and surfaces three callbacks
 * per utterance:
 *   - onAudioChunk(pcmBytes): raw audio bytes (decoded from base64) for the player
 *   - onPhonemeMessage(msg): the verified Sonic 3 phoneme_timestamps frame
 *   - onDone() / onError(err): terminal signals
 *
 * Does NOT play audio or own the lip-sync director — both are wired one level
 * up in `useAvatarSpeech`. That keeps this layer pure transport.
 */

import {
  DEFAULT_CONFIG,
  getCartesiaApiKey,
  type AvatarSpeechConfig,
  type SonicLanguage,
  type SonicOutputFormat,
} from './config';
import {
  isChunkMessage,
  isDoneMessage,
  isErrorMessage,
  isPhonemeMessage,
  parseSonicMessage,
  type Sonic3Message,
} from './sonic3';

export interface SpeakOptions {
  voiceId?: string;
  modelId?: string;
  language?: SonicLanguage;
  outputFormat?: SonicOutputFormat;
  contextId?: string;
}

export interface SpeakHandle {
  /** Resolves on `done`; rejects on `error` or socket close before `done`. */
  finished: Promise<void>;
  /** Best-effort cancel (closes the context; aborts pending audio). */
  cancel: () => void;
  /** The context id Sonic associates with this utterance. */
  contextId: string;
}

export interface SonicVoiceServiceCallbacks {
  onAudioChunk: (pcm: Uint8Array) => void;
  onPhonemeMessage: (msg: Sonic3Message) => void;
  onDone: () => void;
  onError: (err: Error) => void;
  /** Called exactly once on first connect with a raw frame, for adapter verification. */
  onFirstFrame?: (raw: string) => void;
}

export interface SonicVoiceServiceOptions {
  config?: Partial<AvatarSpeechConfig>;
  /** Cartesia API version pinned in the Cartesia-Version header. */
  cartesiaVersion?: string;
}

const DEFAULT_VERSION = '2024-11-13';

export class SonicVoiceService {
  readonly config: AvatarSpeechConfig;
  private readonly cartesiaVersion: string;
  private socket: WebSocket | null = null;
  private connecting: Promise<WebSocket> | null = null;
  private callbacks: SonicVoiceServiceCallbacks | null = null;
  private firstFrameSeen = false;
  private activeContextId: string | null = null;
  private finishedResolve: (() => void) | null = null;
  private finishedReject: ((err: Error) => void) | null = null;
  private reconnectAttempt = 0;

  constructor(opts: SonicVoiceServiceOptions = {}) {
    this.config = { ...DEFAULT_CONFIG, ...opts.config };
    this.cartesiaVersion = opts.cartesiaVersion ?? DEFAULT_VERSION;
  }

  /** Open (or reuse) the socket. */
  private async ensureSocket(): Promise<WebSocket> {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) return this.socket;
    if (this.connecting) return this.connecting;

    const key = getCartesiaApiKey();
    const url =
      `${this.config.wsUrl}?api_key=${encodeURIComponent(key)}` +
      `&cartesia_version=${encodeURIComponent(this.cartesiaVersion)}`;

    this.connecting = new Promise<WebSocket>((resolve, reject) => {
      const ws = new WebSocket(url);
      ws.onopen = () => {
        this.reconnectAttempt = 0;
        this.socket = ws;
        resolve(ws);
      };
      ws.onmessage = (ev) => this.handleMessage(typeof ev.data === 'string' ? ev.data : '');
      ws.onerror = () => {
        // Browsers/RN don't expose error detail on the WS event; use close handler.
      };
      ws.onclose = (ev) => {
        this.socket = null;
        if (this.activeContextId && this.finishedReject) {
          const err = new Error(`Cartesia socket closed before done (code=${ev.code})`);
          this.finishedReject(err);
          this.callbacks?.onError(err);
          this.resetActive();
        }
        if (this.connecting) {
          reject(new Error(`Cartesia connect failed (code=${ev.code})`));
          this.connecting = null;
        }
      };
    });

    try {
      return await this.connecting;
    } finally {
      this.connecting = null;
    }
  }

  private handleMessage(raw: string): void {
    if (!this.firstFrameSeen) {
      this.firstFrameSeen = true;
      this.callbacks?.onFirstFrame?.(raw);
    }
    const msg = parseSonicMessage(raw);
    if (!msg) return;
    const cb = this.callbacks;
    if (!cb) return;

    if (isPhonemeMessage(msg)) {
      cb.onPhonemeMessage(msg);
      return;
    }
    if (isChunkMessage(msg)) {
      const bytes = base64ToBytes(msg.data);
      if (bytes) cb.onAudioChunk(bytes);
      if (msg.done) {
        cb.onDone();
        this.finishedResolve?.();
        this.resetActive();
      }
      return;
    }
    if (isDoneMessage(msg)) {
      cb.onDone();
      this.finishedResolve?.();
      this.resetActive();
      return;
    }
    if (isErrorMessage(msg)) {
      const err = new Error(msg.error || 'Cartesia error');
      cb.onError(err);
      this.finishedReject?.(err);
      this.resetActive();
      return;
    }
  }

  private resetActive(): void {
    this.activeContextId = null;
    this.finishedResolve = null;
    this.finishedReject = null;
    this.callbacks = null;
  }

  /** Speak `text`; returns immediately with a handle. */
  async speak(
    text: string,
    callbacks: SonicVoiceServiceCallbacks,
    opts: SpeakOptions = {}
  ): Promise<SpeakHandle> {
    if (this.activeContextId) {
      throw new Error('SonicVoiceService is already speaking; cancel() or await finished first.');
    }
    const ws = await this.connectWithRetry();
    const contextId = opts.contextId ?? makeContextId();
    this.activeContextId = contextId;
    this.firstFrameSeen = false;
    this.callbacks = callbacks;

    const finished = new Promise<void>((resolve, reject) => {
      this.finishedResolve = resolve;
      this.finishedReject = reject;
    });

    const outputFormat = opts.outputFormat ?? this.config.outputFormat;
    const payload = {
      context_id: contextId,
      model_id: opts.modelId ?? this.config.modelId,
      voice: { mode: 'id', id: opts.voiceId ?? this.config.voiceId },
      language: opts.language ?? this.config.language,
      output_format: outputFormat,
      transcript: text,
      add_phoneme_timestamps: true,
      continue: false,
    };
    ws.send(JSON.stringify(payload));

    return {
      finished,
      contextId,
      cancel: () => this.cancel(contextId),
    };
  }

  cancel(contextId?: string): void {
    const target = contextId ?? this.activeContextId;
    if (!target || !this.socket || this.socket.readyState !== WebSocket.OPEN) {
      this.resetActive();
      return;
    }
    try {
      this.socket.send(JSON.stringify({ context_id: target, cancel: true }));
    } catch {
      /* ignore */
    }
    this.resetActive();
  }

  /** Tear down everything (call from screen unmount / app background). */
  close(): void {
    if (this.activeContextId) this.cancel();
    const s = this.socket;
    this.socket = null;
    if (s && s.readyState <= 1) {
      try {
        s.close();
      } catch {
        /* ignore */
      }
    }
  }

  /** Connect with exponential backoff up to 4 attempts (≈ 0/400/800/1600 ms). */
  private async connectWithRetry(): Promise<WebSocket> {
    let lastErr: unknown = null;
    for (let i = 0; i < 4; i++) {
      try {
        return await this.ensureSocket();
      } catch (err) {
        lastErr = err;
        this.reconnectAttempt = i + 1;
        await delay(i === 0 ? 0 : 200 * 2 ** i);
      }
    }
    throw lastErr instanceof Error ? lastErr : new Error('Cartesia connect failed');
  }
}

function makeContextId(): string {
  // Stable across platforms; not security-sensitive.
  const rand = Math.floor(Math.random() * 0xffffffff).toString(36);
  return `dvnt-${Date.now().toString(36)}-${rand}`;
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function base64ToBytes(b64: string): Uint8Array | null {
  try {
    if (typeof globalThis.atob === 'function') {
      const bin = globalThis.atob(b64);
      const out = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
      return out;
    }
    // RN Hermes: Buffer is not global, but atob is polyfilled by RN 0.65+.
    return null;
  } catch {
    return null;
  }
}
