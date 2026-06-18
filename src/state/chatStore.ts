/**
 * Chat screen UI state. Conversation/model state lives in `useLLM`; this only
 * holds the draft composer text.
 */
import { create } from 'zustand';

type ChatStore = {
  input: string;
  setInput: (value: string) => void;
  clearInput: () => void;
};

export const useChatStore = create<ChatStore>((set) => ({
  input: '',
  setInput: (value) => set({ input: value }),
  clearInput: () => set({ input: '' }),
}));
