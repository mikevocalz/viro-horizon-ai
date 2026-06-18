/**
 * Web has a single runtime, so the list renders inline (no OnRuntime / Nitro).
 */
import { ChatMessageList } from './ChatMessageList';

export function ChatMessagesSurface() {
  return <ChatMessageList />;
}
