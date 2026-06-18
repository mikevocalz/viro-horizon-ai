/**
 * Tutor screen UI state.
 *
 * Conversation/model state lives in the engine hooks (`useChat` for online,
 * `useLLM` for on-device). This store holds the draft composer text and the
 * selected engine. Gemini (online) is the primary engine; on-device ExecuTorch
 * is the secondary option, selectable via the toggle.
 */
import { create } from 'zustand';

export type ChatEngine = 'device' | 'online';

type ChatStore = {
  input: string;
  engine: ChatEngine;
  setInput: (value: string) => void;
  clearInput: () => void;
  setEngine: (engine: ChatEngine) => void;
};

export const useChatStore = create<ChatStore>((set) => ({
  input: '',
  // Gemini-first: default to the online engine; on-device is secondary.
  engine: 'online',
  setInput: (value) => set({ input: value }),
  clearInput: () => set({ input: '' }),
  setEngine: (engine) => set({ engine }),
}));
