/**
 * Models — overview of the on-device AI models the app uses, plus local
 * storage management via the ExecuTorch Expo resource fetcher.
 */
import { useCallback, useEffect } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { ExpoResourceFetcher } from 'react-native-executorch-expo-resource-fetcher';
import { Boxes, Cpu, Image as ImageIcon, Trash2 } from 'lucide-react-native';

import { GradientHeader } from '@/components/GradientHeader';
import { ScreenContainer } from '@/components/ScreenContainer';
import { Colors } from '@/constants/theme';
import { CHAT_MODEL, CLASSIFICATION_MODEL } from '@/lib/executorch';
import { haptics } from '@/lib/haptics';
import { useModelsStore } from '@/state/modelsStore';

type ModelCard = {
  key: string;
  name: string;
  task: string;
  detail: string;
  icon: typeof Cpu;
};

const MODELS: ModelCard[] = [
  {
    key: 'chat',
    name: CHAT_MODEL.modelName,
    task: 'Text generation',
    detail: 'Conversational LLM running locally via XNNPACK.',
    icon: Cpu,
  },
  {
    key: 'classify',
    name: CLASSIFICATION_MODEL.modelName,
    task: 'Image classification',
    detail: 'EfficientNet V2-S over the ImageNet-1k label set.',
    icon: ImageIcon,
  },
];

const MANAGED_SOURCES = [
  CHAT_MODEL.modelSource,
  CHAT_MODEL.tokenizerSource,
  CHAT_MODEL.tokenizerConfigSource,
  CLASSIFICATION_MODEL.modelSource,
];

export default function ModelsScreen() {
  const fileCount = useModelsStore((s) => s.fileCount);
  const busy = useModelsStore((s) => s.busy);
  const setFileCount = useModelsStore((s) => s.setFileCount);
  const setBusy = useModelsStore((s) => s.setBusy);

  const refresh = useCallback(async () => {
    try {
      const files = await ExpoResourceFetcher.listDownloadedFiles();
      setFileCount(files.length);
    } catch {
      setFileCount(null);
    }
  }, [setFileCount]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const clear = useCallback(async () => {
    setBusy(true);
    try {
      await ExpoResourceFetcher.deleteResources(...MANAGED_SOURCES);
      haptics.success();
    } catch {
      haptics.error();
    } finally {
      setBusy(false);
      void refresh();
    }
  }, [refresh, setBusy]);

  return (
    <ScreenContainer>
      <GradientHeader
        title="Models"
        subtitle="On-device · downloaded on first use"
        gradient="brand"
      />
      <ScrollView>
        <View className="gap-3 p-4">
          {MODELS.map((m) => {
            const Icon = m.icon;
            return (
              <View
                key={m.key}
                className="flex-row gap-3 rounded-[18px] border border-border bg-surface p-4"
              >
                <View className="h-11 w-11 items-center justify-center rounded-xl bg-surface-elevated">
                  <Icon color={Colors.accent} size={22} />
                </View>
                <View className="flex-1 gap-0.5">
                  <Text className="text-base font-bold text-text">{m.name}</Text>
                  <Text className="text-[13px] font-semibold text-accent-alt">{m.task}</Text>
                  <Text className="mt-0.5 text-[13px] text-muted">{m.detail}</Text>
                </View>
              </View>
            );
          })}

          <View className="gap-2 rounded-[18px] border border-border bg-surface p-4">
            <View className="flex-row items-center gap-2">
              <Boxes color={Colors.textMuted} size={20} />
              <Text className="text-[15px] font-bold text-text">Local storage</Text>
            </View>
            <Text className="text-muted">
              {fileCount === null
                ? 'Downloaded files: unavailable'
                : `Downloaded files: ${fileCount}`}
            </Text>
            <Pressable
              className={`flex-row items-center gap-2 self-start rounded-xl bg-surface-elevated px-3 py-3 ${
                busy ? 'opacity-50' : ''
              }`}
              onPress={clear}
              disabled={busy}
            >
              <Trash2 color={Colors.danger} size={18} />
              <Text className="font-semibold text-danger">
                {busy ? 'Clearing…' : 'Clear downloaded models'}
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
