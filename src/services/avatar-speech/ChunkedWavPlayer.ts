/**
 * Audio playback for streamed Sonic 3 PCM.
 *
 * Cartesia delivers chunks of raw PCM (`container: "raw"`). expo-audio plays
 * from URIs/assets, not chunk streams, so we accumulate PCM into a single WAV
 * file written to the cache dir and hand it to `createAudioPlayer`.
 *
 * Trade-off: TTFB latency = entire utterance, since we play once `done()`
 * lands. The MediaPlayerClock reads `player.currentTime`/`player.playing` —
 * the lip-sync engine slaves to that real audio position, so visemes stay
 * locked to sound even with the start-delay. Swapping in a sample-streaming
 * native player later is a drop-in replacement: keep the AudioPlayerHandle
 * contract intact and the rest of the stack doesn't move.
 */

import { File, Paths } from 'expo-file-system';
import { createAudioPlayer, type AudioPlayer } from 'expo-audio';
import { MediaPlayerClock, type Clock } from 'react-native-viseme-xr';
import type { SonicOutputFormat } from './config';

export interface AudioPlayerHandle {
  /** Buffer one chunk of PCM bytes (raw, no container). */
  enqueue(pcm: Uint8Array): void;
  /** Signal end-of-utterance; assembles the WAV and starts playback. */
  finalize(): Promise<void>;
  /** Stop and release native resources. */
  stop(): void;
  /** Position in ms within the current utterance (0 if not yet playing). */
  getPositionMs(): number;
  /** True while audio is actively playing. */
  getPlaying(): boolean;
  /** Clock to feed into RealtimeLipsyncDirector.setClock(). */
  clock: Clock;
}

export interface ChunkedWavPlayerOptions {
  format: SonicOutputFormat;
  /** Where to put the temp WAV file; defaults to a unique name under Paths.cache. */
  fileName?: string;
}

export function createChunkedWavPlayer(opts: ChunkedWavPlayerOptions): AudioPlayerHandle {
  const { format } = opts;
  if (format.container !== 'raw') {
    throw new Error(
      `ChunkedWavPlayer requires raw PCM from Sonic (got container=${format.container}). ` +
        'Adjust SonicOutputFormat or supply a different player.'
    );
  }
  if (format.encoding !== 'pcm_s16le' && format.encoding !== 'pcm_f32le') {
    throw new Error(`Unsupported PCM encoding: ${format.encoding}`);
  }

  const chunks: Uint8Array[] = [];
  let player: AudioPlayer | null = null;
  let file: File | null = null;
  let finalized = false;

  const handle: AudioPlayerHandle = {
    enqueue(pcm) {
      if (finalized) return;
      chunks.push(pcm);
    },
    async finalize() {
      if (finalized) return;
      finalized = true;

      const totalPcmBytes = chunks.reduce((n, c) => n + c.length, 0);
      if (totalPcmBytes === 0) return;

      const wav = wrapPcmAsWav(chunks, totalPcmBytes, format);
      const name = opts.fileName ?? `sonic-${Date.now()}-${Math.floor(Math.random() * 1e6)}.wav`;
      file = new File(Paths.cache, name);
      file.write(wav);

      player = createAudioPlayer(file.uri ?? null);
      player.play();
    },
    stop() {
      try {
        player?.pause();
      } catch {
        /* ignore */
      }
      try {
        player?.remove();
      } catch {
        /* ignore */
      }
      player = null;
      try {
        file?.delete();
      } catch {
        /* ignore */
      }
      file = null;
      chunks.length = 0;
    },
    getPositionMs(): number {
      const p = player;
      if (!p) return 0;
      return Math.max(0, p.currentTime * 1000);
    },
    getPlaying(): boolean {
      return player?.playing ?? false;
    },
    clock: null as unknown as Clock,
  };

  handle.clock = new MediaPlayerClock(
    () => handle.getPositionMs(),
    () => handle.getPlaying()
  );

  return handle;
}

/**
 * Assemble raw PCM chunks into a RIFF/WAVE buffer.
 * pcm_s16le → format 1; pcm_f32le → format 3 (IEEE float).
 */
function wrapPcmAsWav(
  chunks: Uint8Array[],
  totalPcmBytes: number,
  fmt: SonicOutputFormat
): Uint8Array {
  const numChannels = 1; // Sonic stream is mono per voice
  const sampleRate = fmt.sample_rate;
  const bitsPerSample = fmt.encoding === 'pcm_f32le' ? 32 : 16;
  const audioFormat = fmt.encoding === 'pcm_f32le' ? 3 : 1;
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const headerSize = 44;
  const fileSize = headerSize + totalPcmBytes;

  const out = new Uint8Array(fileSize);
  const view = new DataView(out.buffer);

  writeAscii(out, 0, 'RIFF');
  view.setUint32(4, fileSize - 8, true);
  writeAscii(out, 8, 'WAVE');

  writeAscii(out, 12, 'fmt ');
  view.setUint32(16, 16, true); // PCM fmt chunk size
  view.setUint16(20, audioFormat, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);

  writeAscii(out, 36, 'data');
  view.setUint32(40, totalPcmBytes, true);

  let offset = headerSize;
  for (const c of chunks) {
    out.set(c, offset);
    offset += c.length;
  }
  return out;
}

function writeAscii(buf: Uint8Array, at: number, s: string): void {
  for (let i = 0; i < s.length; i++) buf[at + i] = s.charCodeAt(i);
}
