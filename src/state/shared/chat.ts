/**
 * Cross-runtime chat surface store (native).
 *
 * The chat message list renders on a secondary runtime, so its data can't live
 * in a main-runtime Zustand store. `createSharedStore` is backed by a native C++
 * singleton keyed by `name`, so the main runtime (writer) and the secondary
 * runtime (reader) both see the same value.
 */
import { createSharedStore } from '@react-native-runtimes/state';

import { INITIAL_CHAT_SURFACE, type ChatSurfaceState } from './types';

const store = createSharedStore<ChatSurfaceState>({
  name: 'chat-surface',
  initialState: INITIAL_CHAT_SURFACE,
});

export function setChatSurface(next: ChatSurfaceState): void {
  void store.setState(next, true);
}

export function useChatSurface(): ChatSurfaceState {
  return store.useStore();
}
