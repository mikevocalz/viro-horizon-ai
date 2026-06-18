/**
 * Renders the chat conversation from the cross-runtime chat store.
 *
 * This component is mounted on a secondary runtime (native) or inline (web).
 * It must stay self-contained — only RN primitives, theme tokens, and the
 * shared store — so it can run in an isolated Hermes instance.
 */
import { useRef } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Colors, Radius, Spacing } from '@/constants/theme';
import { useChatSurface } from '@/state/shared/chat';

function Bubble({ role, content }: { role: string; content: string }) {
  const isUser = role === 'user';
  return (
    <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAssistant]}>
      <Text style={isUser ? styles.bubbleTextUser : styles.bubbleText}>{content}</Text>
    </View>
  );
}

export function ChatMessageList() {
  const { messages, streaming, emptyHint, error } = useChatSurface();
  const scrollRef = useRef<ScrollView>(null);

  return (
    <ScrollView
      ref={scrollRef}
      style={styles.flex}
      contentContainerStyle={styles.messages}
      onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
    >
      {messages.length === 0 && !streaming ? (
        <Text style={styles.empty}>{emptyHint}</Text>
      ) : null}
      {messages.map((m) => (
        <Bubble key={m.id} role={m.role} content={m.content} />
      ))}
      {streaming ? <Bubble role="assistant" content={streaming} /> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  messages: { padding: Spacing.lg, gap: Spacing.md },
  empty: { color: Colors.textMuted, textAlign: 'center', marginTop: Spacing.xxl },
  error: { color: Colors.danger, textAlign: 'center', marginTop: Spacing.sm },
  bubble: {
    maxWidth: '85%',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.lg,
  },
  bubbleUser: {
    alignSelf: 'flex-end',
    backgroundColor: Colors.accent,
    borderBottomRightRadius: Radius.sm,
  },
  bubbleAssistant: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.surfaceElevated,
    borderBottomLeftRadius: Radius.sm,
  },
  bubbleText: { color: Colors.text, fontSize: 15, lineHeight: 21 },
  bubbleTextUser: { color: '#06122E', fontSize: 15, lineHeight: 21, fontWeight: '500' },
});
