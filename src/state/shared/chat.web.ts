/**
 * Cross-runtime chat surface store (web fallback).
 *
 * Web has a single runtime and no Nitro, so we back the same API with a plain
 * Zustand store.
 */
import { create } from 'zustand';

import { INITIAL_CHAT_SURFACE, type ChatSurfaceState } from './types';

const useStore = create<ChatSurfaceState>(() => INITIAL_CHAT_SURFACE);

export function setChatSurface(next: ChatSurfaceState): void {
  useStore.setState(next, true);
}

export function useChatSurface(): ChatSurfaceState {
  return useStore();
}
