/**
 * Renders classification results from the cross-runtime predictions store.
 * Self-contained so it can run on a secondary runtime (native) or inline (web).
 */
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Colors, Radius, Spacing } from '@/constants/theme';
import { usePredictionsSurface } from '@/state/shared/predictions';

export function ClassifyResultsList() {
  const { predictions, generating } = usePredictionsSurface();

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.content}>
      {generating ? (
        <View style={styles.loader}>
          <ActivityIndicator color={Colors.accent} />
          <Text style={styles.loaderText}>Classifying…</Text>
        </View>
      ) : null}
      {predictions.map((p, i) => (
        <View key={p.label} style={styles.row}>
          <View style={styles.rowHeader}>
            <Text style={[styles.rowLabel, i === 0 && styles.rowLabelTop]}>{p.label}</Text>
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { gap: Spacing.lg, paddingVertical: Spacing.sm },
  loader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  loaderText: { color: Colors.textMuted },
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
});
