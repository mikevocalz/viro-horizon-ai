/**
 * Mounts the chat message list on a dedicated secondary runtime so streaming
 * token updates and list rendering never block the main JS thread (navigation,
 * the composer, the engine toggle).
 *
 * Metro auto-registers the wrapped component; native mounts it on `chat-runtime`.
 */
import { StyleSheet } from 'react-native';
import { OnRuntime } from '@react-native-runtimes/core';

import { ChatMessageList } from './ChatMessageList';

export function ChatMessagesSurface() {
  return (
    <OnRuntime name="chat-runtime" style={styles.flex}>
      <ChatMessageList />
    </OnRuntime>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
