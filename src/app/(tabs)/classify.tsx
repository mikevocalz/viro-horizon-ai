/**
 * On-device image classification (ExecuTorch / EfficientNet V2-S, ImageNet-1k).
 *
 * Pick an image from the library; `forward()` runs the model locally and
 * returns a label→confidence map, which we sort into a top-5 leaderboard.
 */
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useClassification } from 'react-native-executorch';
import { ImagePlus } from 'lucide-react-native';

import { GradientHeader } from '@/components/GradientHeader';
import { ScreenContainer } from '@/components/ScreenContainer';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { CLASSIFICATION_MODEL } from '@/lib/executorch';
import { haptics } from '@/lib/haptics';

type Prediction = { label: string; score: number };

function prettify(label: string): string {
  return label
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function ClassifyScreen() {
  const classifier = useClassification({ model: CLASSIFICATION_MODEL });
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [predictions, setPredictions] = useState<Prediction[]>([]);

  const pickAndClassify = useCallback(async () => {
    if (!classifier.isReady || classifier.isGenerating) {
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 1,
    });
    if (result.canceled || result.assets.length === 0) {
      return;
    }
    const uri = result.assets[0].uri;
    setImageUri(uri);
    setPredictions([]);
    try {
      const scores = await classifier.forward(uri);
      const ranked = Object.entries(scores)
        .map(([label, score]) => ({ label: prettify(label), score }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);
      setPredictions(ranked);
      haptics.success();
    } catch {
      haptics.error();
    }
  }, [classifier]);

  return (
    <ScreenContainer>
      <GradientHeader
        title="Image Classification"
        subtitle={`EfficientNet V2-S · ${classifier.isReady ? 'ready' : 'loading'}`}
        gradient="dusk"
      />

      <ScrollView contentContainerStyle={styles.content}>
        {!classifier.isReady ? (
          <View style={styles.loader}>
            <ActivityIndicator color={Colors.accent} />
            <Text style={styles.loaderText}>
              {classifier.error
                ? `Failed to load model: ${classifier.error.message}`
                : `Downloading model… ${Math.round(classifier.downloadProgress * 100)}%`}
            </Text>
          </View>
        ) : (
          <>
            <Pressable
              style={styles.preview}
              onPress={pickAndClassify}
              disabled={classifier.isGenerating}
            >
              {imageUri ? (
                <Image source={{ uri: imageUri }} style={styles.image} contentFit="cover" />
              ) : (
                <View style={styles.placeholder}>
                  <ImagePlus color={Colors.textMuted} size={40} />
                  <Text style={styles.placeholderText}>Tap to pick an image</Text>
                </View>
              )}
            </Pressable>

            {classifier.isGenerating ? (
              <View style={styles.inlineLoader}>
                <ActivityIndicator color={Colors.accent} />
                <Text style={styles.loaderText}>Classifying…</Text>
              </View>
            ) : null}

            {predictions.map((p, i) => (
              <View key={p.label} style={styles.row}>
                <View style={styles.rowHeader}>
                  <Text style={[styles.rowLabel, i === 0 && styles.rowLabelTop]}>
                    {p.label}
                  </Text>
                  <Text style={styles.rowScore}>{(p.score * 100).toFixed(1)}%</Text>
                </View>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.barFill,
                      { width: `${Math.max(2, Math.min(100, p.score * 100))}%` },
                      i === 0 && styles.barFillTop,
                    ]}
                  />
                </View>
              </View>
            ))}

            {imageUri ? (
              <Pressable style={styles.button} onPress={pickAndClassify}>
                <Text style={styles.buttonText}>Pick another image</Text>
              </Pressable>
            ) : null}
          </>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { padding: Spacing.lg, gap: Spacing.lg },
  loader: { alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.xxl },
  inlineLoader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  loaderText: { color: Colors.textMuted, textAlign: 'center' },
  preview: {
    aspectRatio: 1,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  image: { flex: 1 },
  placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.sm },
  placeholderText: { color: Colors.textMuted },
  row: { gap: Spacing.xs },
  rowHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  rowLabel: { color: Colors.text, fontSize: 15, fontWeight: '500' },
  rowLabelTop: { color: Colors.accentAlt, fontWeight: '700' },
  rowScore: { color: Colors.textMuted, fontVariant: ['tabular-nums'] },
  barTrack: {
    height: 8,
    borderRadius: Radius.pill,
    backgroundColor: Colors.surfaceElevated,
    overflow: 'hidden',
  },
  barFill: { height: '100%', borderRadius: Radius.pill, backgroundColor: Colors.accent },
  barFillTop: { backgroundColor: Colors.accentAlt },
  button: {
    marginTop: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    alignItems: 'center',
    backgroundColor: Colors.surfaceElevated,
  },
  buttonText: { color: Colors.text, fontWeight: '600' },
});
