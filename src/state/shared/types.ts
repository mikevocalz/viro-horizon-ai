/**
 * Plain data types shared across the main + secondary runtimes. No native
 * imports here so both the native and web store implementations can use them.
 */
export type DisplayMessage = { id: string; role: string; content: string };

export type ChatSurfaceState = {
  messages: DisplayMessage[];
  streaming: string;
  emptyHint: string;
  error: string;
};

export const INITIAL_CHAT_SURFACE: ChatSurfaceState = {
  messages: [],
  streaming: '',
  emptyHint: '',
  error: '',
};
