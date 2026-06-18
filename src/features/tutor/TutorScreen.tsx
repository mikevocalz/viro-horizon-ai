/**
 * Tutor — on-device LLM (ExecuTorch) with an online Google (Gemini) fallback,
 * driven by the homework tutor prompt. When the active homework has an XR scene
 * plan, the "Study in XR" offer card appears above the composer.
 *
 * The streaming message list renders on a secondary runtime; this screen owns the
 * engines and pushes the conversation into the cross-runtime chat store.
 */
import { useCallback, useEffect, useMemo } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
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
import { ChatMessagesSurface } from '@/components/runtime/ChatMessagesSurface';
import { Colors } from '@/constants/theme';
import { CHAT_MODEL, executorchAvailable } from '@/lib/executorch';
import { generateApiUrl } from '@/lib/api';
import { haptics } from '@/lib/haptics';
import { useChatStore } from '@/state/chatStore';
import { setChatSurface } from '@/state/shared/chat';
import type { DisplayMessage } from '@/state/shared/types';
import { useHomeworkStore } from '@/features/homework/homeworkStore';
import { TUTOR_SYSTEM_PROMPT } from '@/features/tutor/tutorPrompts';
import { XRStudyCTA } from '@/features/tutor/XRStudyCTA';

function uiMessageText(message: UIMessage): string {
  return message.parts.filter(isTextUIPart).map((part) => part.text).join('');
}

export default function TutorScreen() {
  const input = useChatStore((s) => s.input);
  const engine = useChatStore((s) => s.engine);
  const setInput = useChatStore((s) => s.setInput);
  const clearInput = useChatStore((s) => s.clearInput);
  const setEngine = useChatStore((s) => s.setEngine);

  const scan = useHomeworkStore((s) => s.activeHomeworkScan);
  const questions = useHomeworkStore((s) => s.detectedQuestions);

  const llm = useLLM({ model: CHAT_MODEL });

  const transport = useMemo(
    () =>
      new DefaultChatTransport<UIMessage>({
        api: generateApiUrl('/api/chat'),
        fetch: expoFetch as unknown as typeof globalThis.fetch,
      }),
    [],
  );
  const online = useChat({ transport });

  // Homework-aware tutor system prompt (on-device path).
  const systemPrompt = useMemo(() => {
    if (!scan) {
      return TUTOR_SYSTEM_PROMPT;
    }
    const qs = questions.map((q, i) => `${i + 1}. ${q.prompt}`).join('\n');
    return `${TUTOR_SYSTEM_PROMPT}\n\nScanned homework topic: ${scan.topic} (subject: ${scan.subject}).\nDetected questions:\n${qs}`;
  }, [scan, questions]);

  useEffect(() => {
    if (llm.isReady) {
      llm.configure({ chatConfig: { systemPrompt } });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [llm.isReady, systemPrompt]);

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

  const messages: DisplayMessage[] = useMemo(
    () =>
      isOnline
        ? online.messages.map((m) => ({ id: m.id, role: m.role, content: uiMessageText(m) }))
        : llm.messageHistory
            .filter((m) => m.role !== 'system')
            .map((m, i) => ({ id: `${m.role}-${i}`, role: m.role, content: m.content })),
    [isOnline, online.messages, llm.messageHistory],
  );

  const streaming = !isOnline && llm.isGenerating ? llm.response : '';
  const errorMessage = (isOnline ? online.error?.message : llm.error?.message) ?? '';

  useEffect(() => {
    setChatSurface({
      messages,
      streaming,
      emptyHint: scan
        ? `Let's study "${scan.topic}". Ask me anything, or scan a new worksheet.`
        : 'Scan your homework to start, or ask a question.',
      error: isOnline ? errorMessage : '',
    });
  }, [messages, streaming, isOnline, errorMessage, scan]);

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

  const deviceLoading = !isOnline && !llm.isReady;

  return (
    <ScreenContainer>
      <GradientHeader
        title="Tutor"
        subtitle={isOnline ? 'Google Gemini · online' : `Qwen3 0.6B · ${ready ? 'ready' : 'loading'}`}
        gradient="brand"
        height={150}
      />

      <View className="flex-row gap-2 px-4 pt-3">
        <Pressable
          className={`rounded-full border bg-surface px-3 py-1 ${
            !isOnline ? 'border-accent bg-surface-elevated' : 'border-border'
          }`}
          onPress={() => {
            haptics.selection();
            setEngine('device');
          }}
          disabled={!executorchAvailable}
        >
          <Text className={`text-[13px] font-semibold ${!isOnline ? 'text-text' : 'text-muted'}`}>
            On-device
          </Text>
        </Pressable>
        <Pressable
          className={`rounded-full border bg-surface px-3 py-1 ${
            isOnline ? 'border-accent bg-surface-elevated' : 'border-border'
          }`}
          onPress={() => {
            haptics.selection();
            setEngine('online');
          }}
        >
          <Text className={`text-[13px] font-semibold ${isOnline ? 'text-text' : 'text-muted'}`}>
            Online
          </Text>
        </Pressable>
      </View>

      {deviceLoading ? (
        <View className="flex-1 items-center justify-center gap-3 p-6">
          <ActivityIndicator color={Colors.accent} />
          <Text className="text-center text-muted">
            {errorMessage
              ? `Failed to load model: ${errorMessage}`
              : `Downloading model… ${Math.round(llm.downloadProgress * 100)}%`}
          </Text>
        </View>
      ) : (
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
        >
          <View className="flex-1">
            <ChatMessagesSurface />
          </View>

          <XRStudyCTA />

          <View className="flex-row items-end gap-2 border-t border-border bg-surface p-3">
            <TextInput
              className="max-h-[120px] flex-1 rounded-[18px] bg-surface-elevated px-3 py-2 text-[15px] text-text"
              value={input}
              onChangeText={setInput}
              placeholder="Ask your tutor"
              placeholderTextColor={Colors.textMuted}
              multiline
              editable={!isBusy}
            />
            {isBusy ? (
              <Pressable
                className="h-11 w-11 items-center justify-center rounded-full bg-danger"
                onPress={stop}
                accessibilityLabel="Stop generating"
              >
                <Square color={Colors.text} size={20} fill={Colors.text} />
              </Pressable>
            ) : (
              <Pressable
                className={`h-11 w-11 items-center justify-center rounded-full bg-accent ${
                  !canSend ? 'opacity-40' : ''
                }`}
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
