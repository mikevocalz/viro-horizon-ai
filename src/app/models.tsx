/**
 * Models — overview of the on-device AI models the app uses, plus local
 * storage management via the ExecuTorch Expo resource fetcher.
 */
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ExpoResourceFetcher } from 'react-native-executorch-expo-resource-fetcher';
import { Boxes, Cpu, Image as ImageIcon, Trash2 } from 'lucide-react-native';

import { GradientHeader } from '@/components/GradientHeader';
import { ScreenContainer } from '@/components/ScreenContainer';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { CHAT_MODEL, CLASSIFICATION_MODEL } from '@/lib/executorch';
import { haptics } from '@/lib/haptics';

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
  const [fileCount, setFileCount] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const files = await ExpoResourceFetcher.listDownloadedFiles();
      setFileCount(files.length);
    } catch {
      setFileCount(null);
    }
  }, []);

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
  }, [refresh]);

  return (
    <ScreenContainer>
      <GradientHeader
        title="Models"
        subtitle="On-device · downloaded on first use"
        gradient="brand"
      />
      <ScrollView contentContainerStyle={styles.content}>
        {MODELS.map((m) => {
          const Icon = m.icon;
          return (
            <View key={m.key} style={styles.card}>
              <View style={styles.iconWrap}>
                <Icon color={Colors.accent} size={22} />
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.cardName}>{m.name}</Text>
                <Text style={styles.cardTask}>{m.task}</Text>
                <Text style={styles.cardDetail}>{m.detail}</Text>
              </View>
            </View>
          );
        })}

        <View style={styles.storageCard}>
          <View style={styles.storageHeader}>
            <Boxes color={Colors.textMuted} size={20} />
            <Text style={styles.storageTitle}>Local storage</Text>
          </View>
          <Text style={styles.storageText}>
            {fileCount === null
              ? 'Downloaded files: unavailable'
              : `Downloaded files: ${fileCount}`}
          </Text>
          <Pressable
            style={[styles.clearButton, busy && styles.disabled]}
            onPress={clear}
            disabled={busy}
          >
            <Trash2 color={Colors.danger} size={18} />
            <Text style={styles.clearText}>
              {busy ? 'Clearing…' : 'Clear downloaded models'}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { padding: Spacing.lg, gap: Spacing.md },
  card: {
    flexDirection: 'row',
    gap: Spacing.md,
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  iconWrap: {
    height: 44,
    width: 44,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceElevated,
  },
  cardBody: { flex: 1, gap: 2 },
  cardName: { color: Colors.text, fontSize: 16, fontWeight: '700' },
  cardTask: { color: Colors.accentAlt, fontSize: 13, fontWeight: '600' },
  cardDetail: { color: Colors.textMuted, fontSize: 13, marginTop: 2 },
  storageCard: {
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
  },
  storageHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  storageTitle: { color: Colors.text, fontWeight: '700', fontSize: 15 },
  storageText: { color: Colors.textMuted },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: Colors.surfaceElevated,
    alignSelf: 'flex-start',
  },
  clearText: { color: Colors.danger, fontWeight: '600' },
  disabled: { opacity: 0.5 },
});
