/**
 * On-device LLM chat (ExecuTorch / Qwen3 0.6B).
 *
 * The model is downloaded + loaded lazily by `useLLM`. Until `isReady`, we show
 * the download progress. Generation streams token-by-token into `response`,
 * which we render as a live assistant bubble until it lands in `messageHistory`.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useLLM } from 'react-native-executorch';
import { Send, Square } from 'lucide-react-native';

import { GradientHeader } from '@/components/GradientHeader';
import { ScreenContainer } from '@/components/ScreenContainer';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { CHAT_MODEL } from '@/lib/executorch';
import { haptics } from '@/lib/haptics';

const SYSTEM_PROMPT =
  'You are a helpful, concise assistant running fully on-device. Keep answers short unless asked to elaborate.';

function Bubble({ role, content }: { role: string; content: string }) {
  const isUser = role === 'user';
  return (
    <View
      style={[
        styles.bubble,
        isUser ? styles.bubbleUser : styles.bubbleAssistant,
      ]}
    >
      <Text style={isUser ? styles.bubbleTextUser : styles.bubbleText}>
        {content}
      </Text>
    </View>
  );
}

export default function ChatScreen() {
  const llm = useLLM({ model: CHAT_MODEL });
  const [input, setInput] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (llm.isReady) {
      llm.configure({ chatConfig: { systemPrompt: SYSTEM_PROMPT } });
    }
    // Re-running only when readiness flips is intentional.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [llm.isReady]);

  const onSend = useCallback(async () => {
    const text = input.trim();
    if (!text || !llm.isReady || llm.isGenerating) {
      return;
    }
    setInput('');
    haptics.send();
    try {
      await llm.sendMessage(text);
      haptics.success();
    } catch {
      haptics.error();
    }
  }, [input, llm]);

  const conversation = llm.messageHistory.filter((m) => m.role !== 'system');
  const canSend = llm.isReady && !llm.isGenerating && input.trim().length > 0;

  return (
    <ScreenContainer>
      <GradientHeader
        title="On-device Chat"
        subtitle={`Qwen3 0.6B · ${llm.isReady ? 'ready' : 'loading'}`}
        gradient="brand"
      />

      {!llm.isReady ? (
        <View style={styles.loader}>
          <ActivityIndicator color={Colors.accent} />
          <Text style={styles.loaderText}>
            {llm.error
              ? `Failed to load model: ${llm.error.message}`
              : `Downloading model… ${Math.round(llm.downloadProgress * 100)}%`}
          </Text>
        </View>
      ) : (
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
        >
          <ScrollView
            ref={scrollRef}
            style={styles.flex}
            contentContainerStyle={styles.messages}
            onContentSizeChange={() =>
              scrollRef.current?.scrollToEnd({ animated: true })
            }
          >
            {conversation.length === 0 && !llm.isGenerating ? (
              <Text style={styles.empty}>
                Ask anything — inference never leaves the device.
              </Text>
            ) : null}
            {conversation.map((m, i) => (
              <Bubble key={`${m.role}-${i}`} role={m.role} content={m.content} />
            ))}
            {llm.isGenerating && llm.response ? (
              <Bubble role="assistant" content={llm.response} />
            ) : null}
          </ScrollView>

          <View style={styles.composer}>
            <TextInput
              style={styles.input}
              value={input}
              onChangeText={setInput}
              placeholder="Message"
              placeholderTextColor={Colors.textMuted}
              multiline
              editable={!llm.isGenerating}
            />
            {llm.isGenerating ? (
              <Pressable
                style={[styles.sendButton, styles.stopButton]}
                onPress={() => llm.interrupt()}
                accessibilityLabel="Stop generating"
              >
                <Square color={Colors.text} size={20} fill={Colors.text} />
              </Pressable>
            ) : (
              <Pressable
                style={[styles.sendButton, !canSend && styles.sendButtonDisabled]}
                onPress={onSend}
                disabled={!canSend}
                accessibilityLabel="Send message"
              >
                <Send color={Colors.text} size={20} />
              </Pressable>
            )}
          </View>
        </KeyboardAvoidingView>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    padding: Spacing.xl,
  },
  loaderText: { color: Colors.textMuted, textAlign: 'center' },
  messages: { padding: Spacing.lg, gap: Spacing.md },
  empty: {
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: Spacing.xxl,
  },
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
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  input: {
    flex: 1,
    maxHeight: 120,
    color: Colors.text,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: 15,
  },
  sendButton: {
    height: 44,
    width: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.accent,
  },
  sendButtonDisabled: { opacity: 0.4 },
  stopButton: { backgroundColor: Colors.danger },
});
