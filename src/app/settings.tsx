/**
 * Settings — wires real Pulsar haptics/sound toggles and surfaces app metadata.
 */
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import Constants from 'expo-constants';
import { Volume2, Vibrate, Waves } from 'lucide-react-native';

import { GradientHeader } from '@/components/GradientHeader';
import { ScreenContainer } from '@/components/ScreenContainer';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { haptics } from '@/lib/haptics';
import { useSettingsStore } from '@/state/settingsStore';

export default function SettingsScreen() {
  const hapticsOn = useSettingsStore((s) => s.hapticsEnabled);
  const soundOn = useSettingsStore((s) => s.soundEnabled);
  const setHapticsEnabled = useSettingsStore((s) => s.setHapticsEnabled);
  const setSoundEnabled = useSettingsStore((s) => s.setSoundEnabled);

  const toggleHaptics = (next: boolean) => {
    setHapticsEnabled(next);
    if (next) {
      haptics.selection();
    }
  };

  return (
    <ScreenContainer>
      <GradientHeader title="Settings" subtitle="Feedback & about" gradient="ember" />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.rowLabel}>
              <Vibrate color={Colors.accent} size={20} />
              <Text style={styles.rowText}>Haptic feedback</Text>
            </View>
            <Switch
              value={hapticsOn}
              onValueChange={toggleHaptics}
              trackColor={{ true: Colors.accent, false: Colors.border }}
              thumbColor={Colors.text}
            />
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <View style={styles.rowLabel}>
              <Volume2 color={Colors.accent} size={20} />
              <Text style={styles.rowText}>Haptic sound</Text>
            </View>
            <Switch
              value={soundOn}
              onValueChange={setSoundEnabled}
              trackColor={{ true: Colors.accent, false: Colors.border }}
              thumbColor={Colors.text}
            />
          </View>
        </View>

        <Pressable
          style={[styles.testButton, !hapticsOn && styles.disabled]}
          onPress={() => haptics.success()}
          disabled={!hapticsOn}
        >
          <Waves color={Colors.text} size={18} />
          <Text style={styles.testText}>Test haptic</Text>
        </Pressable>

        <View style={styles.aboutCard}>
          <Text style={styles.aboutTitle}>{Constants.expoConfig?.name ?? 'Viro Horizon AI'}</Text>
          <Text style={styles.aboutText}>
            Version {Constants.expoConfig?.version ?? '1.0.0'}
          </Text>
          <Text style={styles.aboutText}>
            On-device LLM chat, image classification, and ViroReact XR.
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { padding: Spacing.lg, gap: Spacing.lg },
  card: {
    borderRadius: Radius.lg,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
  },
  rowLabel: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  rowText: { color: Colors.text, fontSize: 15, fontWeight: '500' },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: Colors.border },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: Colors.accent,
  },
  testText: { color: Colors.text, fontWeight: '700' },
  disabled: { opacity: 0.4 },
  aboutCard: {
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.xs,
  },
  aboutTitle: { color: Colors.text, fontSize: 16, fontWeight: '700' },
  aboutText: { color: Colors.textMuted },
});
