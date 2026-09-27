/**
 * useAvatarSpeech — the single integration point a screen uses.
 *
 * Owns:
 *   - one SonicVoiceService (cloud TTS + phoneme stream)
 *   - one RealtimeLipsyncDirector (coarticulation + idle + spring)
 *   - one Sonic3PhonemeCollector (accumulates IPA segments as they arrive)
 *   - one ChunkedWavPlayer (audio playback + clock source)
 *   - one rAF loop driving director.update(dt) and pushing morphs to the rig
 *
 * Morphs go straight to the caller's `onMorphs` callback — they are NEVER
 * written to React state. The rAF loop is mounted ONCE per hook instance and
 * keeps running across utterances; only the data underneath swaps.
 */

import { useCallback, useEffect, useRef } from 'react';
import {
  RealtimeLipsyncDirector,
  Sonic3PhonemeCollector,
} from 'react-native-viseme-xr';
import {
  SonicVoiceService,
  type SpeakOptions,
} from './SonicVoiceService';
import {
  createChunkedWavPlayer,
  type AudioPlayerHandle,
} from './ChunkedWavPlayer';
import {
  DEFAULT_CONFIG,
  type AvatarSpeechConfig,
  type SonicOutputFormat,
} from './config';
import { useAvatarSpeechStore } from '@/state/avatarSpeechStore';

export interface UseAvatarSpeechOptions {
  /** Imperative morph applier. MUST NOT touch React state. */
  onMorphs: (morphs: Record<string, number>) => void;
  /** Optional config overrides. */
  config?: Partial<AvatarSpeechConfig>;
  /**
   * Hook for first raw Sonic frame on each new socket — log it once to verify
   * the wire shape matches the adapter, then remove or feature-flag.
   */
  onFirstFrame?: (raw: string) => void;
}

export interface AvatarSpeechController {
  /** Speak `text` end-to-end. Resolves when the utterance finishes. */
  speak: (text: string, opts?: SpeakOptions) => Promise<void>;
  /** Cancel any in-flight utterance and stop audio. */
  cancel: () => void;
}

export function useAvatarSpeech(opts: UseAvatarSpeechOptions): AvatarSpeechController {
  const cfg: AvatarSpeechConfig = { ...DEFAULT_CONFIG, ...opts.config };

  const onMorphsRef = useRef(opts.onMorphs);
  onMorphsRef.current = opts.onMorphs;
  const onFirstFrameRef = useRef(opts.onFirstFrame);
  onFirstFrameRef.current = opts.onFirstFrame;

  const directorRef = useRef<RealtimeLipsyncDirector | null>(null);
  const collectorRef = useRef<Sonic3PhonemeCollector | null>(null);
  const serviceRef = useRef<SonicVoiceService | null>(null);
  const playerRef = useRef<AudioPlayerHandle | null>(null);

  if (!directorRef.current) {
    directorRef.current = new RealtimeLipsyncDirector({
      smoothingHalfLifeMs: cfg.smoothingHalfLifeMs,
      idle: cfg.idle ? undefined : false,
    });
    directorRef.current.setLookaheadMs(cfg.lookaheadMs);
  }
  if (!collectorRef.current) collectorRef.current = new Sonic3PhonemeCollector();
  if (!serviceRef.current) serviceRef.current = new SonicVoiceService({ config: cfg });

  // Frame loop: mounted once, lives across utterances. No state writes.
  useEffect(() => {
    let raf = 0;
    let last = 0;
    const tick = (now: number) => {
      const dt = last ? Math.min((now - last) / 1000, 0.1) : 1 / 60;
      last = now;
      const morphs = directorRef.current!.update(dt);
      onMorphsRef.current(morphs);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Tear everything down on unmount.
  useEffect(() => {
    return () => {
      serviceRef.current?.close();
      playerRef.current?.stop();
      playerRef.current = null;
    };
  }, []);

  const speak = useCallback<AvatarSpeechController['speak']>(
    async (text, callOpts = {}) => {
      const store = useAvatarSpeechStore.getState();
      const director = directorRef.current!;
      const collector = collectorRef.current!;
      const service = serviceRef.current!;

      // Stop any prior utterance.
      service.cancel();
      playerRef.current?.stop();
      playerRef.current = null;
      collector.reset();
      // Push empty segments so director settles to silence cleanly.
      director.loadSonic3([]);

      const format: SonicOutputFormat = callOpts.outputFormat ?? cfg.outputFormat;
      const player = createChunkedWavPlayer({ format });
      playerRef.current = player;
      director.setClock(player.clock);

      const language = callOpts.language ?? cfg.language;
      const voiceId = callOpts.voiceId ?? cfg.voiceId;
      const modelId = callOpts.modelId ?? cfg.modelId;
      store.setActiveVoice(voiceId, modelId, language);
      store.setPhase('connecting');

      let finalizedAudio = false;
      const finalizeOnce = async () => {
        if (finalizedAudio) return;
        finalizedAudio = true;
        try {
          await player.finalize();
          store.setPhase('speaking');
        } catch (err) {
          store.setError(err instanceof Error ? err.message : String(err));
        }
      };

      try {
        const handle = await service.speak(
          text,
          {
            onAudioChunk: (pcm) => player.enqueue(pcm),
            onPhonemeMessage: (msg) => {
              if (collector.ingest(msg)) {
                director.loadSonic3(collector.getSegments());
              }
            },
            onDone: () => {
              void finalizeOnce();
            },
            onError: (err) => {
              store.setError(err.message);
              player.stop();
            },
            onFirstFrame: (raw) => onFirstFrameRef.current?.(raw),
          },
          { ...callOpts, voiceId, modelId, language, outputFormat: format }
        );

        await handle.finished;
        // If `done` arrived as a `chunk` flag we may have already finalized;
        // ensure playback was kicked off either way.
        await finalizeOnce();

        // Wait until the player actually stops; the director's clock tracks it.
        await waitForStop(player);
        store.setPhase('idle');
      } catch (err) {
        store.setError(err instanceof Error ? err.message : String(err));
        playerRef.current?.stop();
        playerRef.current = null;
        throw err;
      }
    },
    [cfg.language, cfg.modelId, cfg.outputFormat, cfg.voiceId]
  );

  const cancel = useCallback(() => {
    serviceRef.current?.cancel();
    playerRef.current?.stop();
    playerRef.current = null;
    collectorRef.current?.reset();
    directorRef.current?.loadSonic3([]);
    useAvatarSpeechStore.getState().setPhase('idle');
  }, []);

  return { speak, cancel };
}

function waitForStop(player: AudioPlayerHandle, timeoutMs = 60_000): Promise<void> {
  return new Promise((resolve) => {
    const start = Date.now();
    const tick = () => {
      if (!player.getPlaying() && player.getPositionMs() > 0) return resolve();
      if (Date.now() - start > timeoutMs) return resolve();
      setTimeout(tick, 100);
    };
    setTimeout(tick, 200); // give expo-audio a moment to actually start
  });
}
