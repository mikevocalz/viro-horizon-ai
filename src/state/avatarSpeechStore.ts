/**
 * Avatar-speech surface state (Zustand, per CLAUDE.md).
 *
 * Per-frame morphs DO NOT live here — they're pushed imperatively to the
 * avatar via setNativeProps / morphTargetInfluences. This store only holds
 * coarse state the UI cares about: are we speaking, what's the last error,
 * what's the active voice/model/language.
 */

import { create } from 'zustand';
import type { SonicLanguage } from '@/services/avatar-speech/config';

export type AvatarSpeechPhase = 'idle' | 'connecting' | 'speaking' | 'error';

type AvatarSpeechStore = {
  phase: AvatarSpeechPhase;
  lastError: string | null;
  voiceId: string | null;
  modelId: string | null;
  language: SonicLanguage | null;
  setPhase: (phase: AvatarSpeechPhase) => void;
  setError: (msg: string | null) => void;
  setActiveVoice: (voiceId: string, modelId: string, language: SonicLanguage) => void;
  reset: () => void;
};

export const useAvatarSpeechStore = create<AvatarSpeechStore>((set) => ({
  phase: 'idle',
  lastError: null,
  voiceId: null,
  modelId: null,
  language: null,
  setPhase: (phase) => set({ phase, ...(phase === 'speaking' ? { lastError: null } : {}) }),
  setError: (msg) => set({ lastError: msg, phase: msg ? 'error' : 'idle' }),
  setActiveVoice: (voiceId, modelId, language) => set({ voiceId, modelId, language }),
  reset: () => set({ phase: 'idle', lastError: null }),
}));
