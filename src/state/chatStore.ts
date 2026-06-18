/**
 * Chat screen UI state.
 *
 * Conversation/model state lives in the engine hooks (`useLLM` for on-device,
 * `useChat` for online). This store holds the draft composer text and the
 * selected engine. The engine defaults to on-device when the ExecuTorch runtime
 * is available, otherwise it falls back to the online (Google) engine.
 */
import { create } from 'zustand';

import { executorchAvailable } from '@/lib/executorch';

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
  engine: executorchAvailable ? 'device' : 'online',
  setInput: (value) => set({ input: value }),
  clearInput: () => set({ input: '' }),
  setEngine: (engine) => set({ engine }),
}));
