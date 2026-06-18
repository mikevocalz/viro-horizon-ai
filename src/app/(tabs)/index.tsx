/**
 * Chat — on-device LLM (ExecuTorch) with an online Google (Gemini) fallback.
 *
 * Engine selection:
 *  - Defaults to on-device when the ExecuTorch runtime is available.
 *  - Auto-falls back to online if the device runtime is unavailable or the model
 *    fails to load.
 *  - Can be switched manually via the segmented control.
 *
 * Both engines stream token-by-token: on-device via `useLLM`'s `response`,
 * online via `useChat` (Vercel AI SDK) message parts.
 */
import { useCallback, useEffect, useMemo, useRef } from 'react';
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
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, isTextUIPart, type UIMessage } from 'ai';
import { fetch as expoFetch } from 'expo/fetch';
import { Send, Square } from 'lucide-react-native';

import { GradientHeader } from '@/components/GradientHeader';
import { ScreenContainer } from '@/components/ScreenContainer';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { CHAT_MODEL, executorchAvailable } from '@/lib/executorch';
import { generateApiUrl } from '@/lib/api';
import { haptics } from '@/lib/haptics';
import { useChatStore } from '@/state/chatStore';

const SYSTEM_PROMPT =
  'You are a helpful, concise assistant running fully on-device. Keep answers short unless asked to elaborate.';

type DisplayMessage = { id: string; role: string; content: string };

function uiMessageText(message: UIMessage): string {
  return message.parts.filter(isTextUIPart).map((part) => part.text).join('');
}

function Bubble({ role, content }: { role: string; content: string }) {
  const isUser = role === 'user';
  return (
    <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAssistant]}>
      <Text style={isUser ? styles.bubbleTextUser : styles.bubbleText}>{content}</Text>
    </View>
  );
}

export default function ChatScreen() {
  const input = useChatStore((s) => s.input);
  const engine = useChatStore((s) => s.engine);
  const setInput = useChatStore((s) => s.setInput);
  const clearInput = useChatStore((s) => s.clearInput);
  const setEngine = useChatStore((s) => s.setEngine);
  const scrollRef = useRef<ScrollView>(null);

  // --- On-device engine ---
  const llm = useLLM({ model: CHAT_MODEL });

  // --- Online engine (Vercel AI SDK -> Expo API route -> Google Gemini) ---
  const transport = useMemo(
    () =>
      new DefaultChatTransport<UIMessage>({
        api: generateApiUrl('/api/chat'),
        fetch: expoFetch as unknown as typeof globalThis.fetch,
      }),
    [],
  );
  const online = useChat({ transport });

  useEffect(() => {
    if (llm.isReady) {
      llm.configure({ chatConfig: { systemPrompt: SYSTEM_PROMPT } });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [llm.isReady]);

  // Automatic fallback: device runtime missing or model failed to load.
  useEffect(() => {
    if (engine === 'device' && (!executorchAvailable || llm.error)) {
      setEngine('online');
    }
  }, [engine, llm.error, setEngine]);

  const isOnline = engine === 'online';
  const onlineBusy = online.status === 'submitted' || online.status === 'streaming';
  const isBusy = isOnline ? onlineBusy : llm.isGenerating;
  const ready = isOnline ? true : llm.isReady;
  const canSend = ready && !isBusy && input.trim().length > 0;

  const onSend = useCallback(async () => {
    const text = input.trim();
    if (!text || isBusy || !ready) {
      return;
    }
    clearInput();
    haptics.send();
    try {
      if (isOnline) {
        await online.sendMessage({ text });
      } else {
        await llm.sendMessage(text);
      }
      haptics.success();
    } catch {
      haptics.error();
    }
  }, [input, isBusy, ready, isOnline, online, llm, clearInput]);

  const stop = useCallback(() => {
    if (isOnline) {
      online.stop();
    } else {
      llm.interrupt();
    }
  }, [isOnline, online, llm]);

  // Normalize both engines into a single render list.
  const messages: DisplayMessage[] = isOnline
    ? online.messages.map((m) => ({ id: m.id, role: m.role, content: uiMessageText(m) }))
    : llm.messageHistory
        .filter((m) => m.role !== 'system')
        .map((m, i) => ({ id: `${m.role}-${i}`, role: m.role, content: m.content }));

  const streamingBubble =
    !isOnline && llm.isGenerating && llm.response ? llm.response : null;

  const deviceLoading = !isOnline && !llm.isReady;
  const errorMessage = isOnline ? online.error?.message : llm.error?.message;

  return (
    <ScreenContainer>
      <GradientHeader
        title="Chat"
        subtitle={isOnline ? 'Google Gemini · online' : `Qwen3 0.6B · ${ready ? 'ready' : 'loading'}`}
        gradient="brand"
        height={150}
      />

      <View style={styles.engineRow}>
        <Pressable
          style={[styles.enginePill, !isOnline && styles.enginePillActive]}
          onPress={() => {
            haptics.selection();
            setEngine('device');
          }}
          disabled={!executorchAvailable}
        >
          <Text style={[styles.engineText, !isOnline && styles.engineTextActive]}>
            On-device
          </Text>
        </Pressable>
        <Pressable
          style={[styles.enginePill, isOnline && styles.enginePillActive]}
          onPress={() => {
            haptics.selection();
            setEngine('online');
          }}
        >
          <Text style={[styles.engineText, isOnline && styles.engineTextActive]}>Online</Text>
        </Pressable>
      </View>

      {deviceLoading ? (
        <View style={styles.loader}>
          <ActivityIndicator color={Colors.accent} />
          <Text style={styles.loaderText}>
            {errorMessage
              ? `Failed to load model: ${errorMessage}`
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
            onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
          >
            {messages.length === 0 && !streamingBubble ? (
              <Text style={styles.empty}>
                {isOnline
                  ? 'Ask anything — answered by Google Gemini.'
                  : 'Ask anything — inference never leaves the device.'}
              </Text>
            ) : null}
            {messages.map((m) => (
              <Bubble key={m.id} role={m.role} content={m.content} />
            ))}
            {streamingBubble ? <Bubble role="assistant" content={streamingBubble} /> : null}
            {isOnline && errorMessage ? (
              <Text style={styles.errorText}>{errorMessage}</Text>
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
              editable={!isBusy}
            />
            {isBusy ? (
              <Pressable
                style={[styles.sendButton, styles.stopButton]}
                onPress={stop}
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
  engineRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  enginePill: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.pill,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  enginePillActive: { backgroundColor: Colors.surfaceElevated, borderColor: Colors.accent },
  engineText: { color: Colors.textMuted, fontWeight: '600', fontSize: 13 },
  engineTextActive: { color: Colors.text },
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    padding: Spacing.xl,
  },
  loaderText: { color: Colors.textMuted, textAlign: 'center' },
  messages: { padding: Spacing.lg, gap: Spacing.md },
  empty: { color: Colors.textMuted, textAlign: 'center', marginTop: Spacing.xxl },
  errorText: { color: Colors.danger, textAlign: 'center', marginTop: Spacing.sm },
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
