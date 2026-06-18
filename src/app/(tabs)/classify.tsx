/**
 * On-device image classification (ExecuTorch / EfficientNet V2-S, ImageNet-1k).
 *
 * Pick an image; `forward()` runs the model locally and returns a label→
 * confidence map. This screen (main runtime) writes the ranked results into the
 * cross-runtime predictions store; `ClassifyResultsSurface` renders the bars on
 * a secondary runtime so building them never blocks the picker/preview.
 */
import { useCallback } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useClassification } from 'react-native-executorch';
import { ImagePlus } from 'lucide-react-native';

import { GradientHeader } from '@/components/GradientHeader';
import { ScreenContainer } from '@/components/ScreenContainer';
import { ClassifyResultsSurface } from '@/components/runtime/ClassifyResultsSurface';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { CLASSIFICATION_MODEL } from '@/lib/executorch';
import { haptics } from '@/lib/haptics';
import { useClassifyStore } from '@/state/classifyStore';
import { setPredictionsSurface } from '@/state/shared/predictions';

function prettify(label: string): string {
  return label
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function ClassifyScreen() {
  const classifier = useClassification({ model: CLASSIFICATION_MODEL });
  const imageUri = useClassifyStore((s) => s.imageUri);
  const setImage = useClassifyStore((s) => s.setImage);

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
    setImage(uri);
    setPredictionsSurface({ predictions: [], generating: true });
    try {
      const scores = await classifier.forward(uri);
      const ranked = Object.entries(scores)
        .map(([label, score]) => ({ label: prettify(label), score }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);
      setPredictionsSurface({ predictions: ranked, generating: false });
      haptics.success();
    } catch {
      setPredictionsSurface({ predictions: [], generating: false });
      haptics.error();
    }
  }, [classifier, setImage]);

  return (
    <ScreenContainer>
      <GradientHeader
        title="Image Classification"
        subtitle={`EfficientNet V2-S · ${classifier.isReady ? 'ready' : 'loading'}`}
        gradient="dusk"
      />

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
        <View style={styles.body}>
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

          <View style={styles.results}>
            <ClassifyResultsSurface />
          </View>

          {imageUri ? (
            <Pressable style={styles.button} onPress={pickAndClassify}>
              <Text style={styles.buttonText}>Pick another image</Text>
            </Pressable>
          ) : null}
        </View>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, padding: Spacing.lg, gap: Spacing.lg },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md, padding: Spacing.xl },
  loaderText: { color: Colors.textMuted, textAlign: 'center' },
  preview: {
    height: 260,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  image: { flex: 1 },
  placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.sm },
  placeholderText: { color: Colors.textMuted },
  results: { flex: 1 },
  button: {
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    alignItems: 'center',
    backgroundColor: Colors.surfaceElevated,
  },
  buttonText: { color: Colors.text, fontWeight: '600' },
});
