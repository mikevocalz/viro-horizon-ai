/**
 * Profile — identity placeholder plus live device + Horizon diagnostics.
 */
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import * as Device from 'expo-device';
import { Headset, Smartphone, User } from 'lucide-react-native';

import { GradientHeader } from '@/components/GradientHeader';
import { ScreenContainer } from '@/components/ScreenContainer';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { getHorizonAppId, isHorizonBuild, isHorizonDevice } from '@/lib/horizon';

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.factRow}>
      <Text style={styles.factLabel}>{label}</Text>
      <Text style={styles.factValue}>{value}</Text>
    </View>
  );
}

export default function ProfileScreen() {
  const onHorizon = isHorizonDevice();

  return (
    <ScreenContainer>
      <GradientHeader title="Profile" subtitle="Your device & session" gradient="dusk" />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.identity}>
          <View style={styles.avatar}>
            <User color={Colors.text} size={34} />
          </View>
          <Text style={styles.name}>Local User</Text>
          <Text style={styles.tagline}>Everything runs on this device</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Smartphone color={Colors.accent} size={20} />
            <Text style={styles.cardTitle}>Device</Text>
          </View>
          <Fact label="Name" value={Device.deviceName ?? 'Unknown'} />
          <Fact label="Model" value={Device.modelName ?? 'Unknown'} />
          <Fact label="Brand" value={Device.brand ?? 'Unknown'} />
          <Fact
            label="OS"
            value={`${Device.osName ?? 'Unknown'} ${Device.osVersion ?? ''}`.trim()}
          />
          <Fact label="Physical device" value={Device.isDevice ? 'Yes' : 'No (simulator)'} />
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Headset color={Colors.accentAlt} size={20} />
            <Text style={styles.cardTitle}>Horizon OS</Text>
          </View>
          <Fact label="Horizon device" value={onHorizon ? 'Yes' : 'No'} />
          <Fact label="Horizon build" value={isHorizonBuild() ? 'Yes' : 'No'} />
          <Fact label="Horizon app id" value={getHorizonAppId() ?? '—'} />
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { padding: Spacing.lg, gap: Spacing.lg },
  identity: { alignItems: 'center', gap: Spacing.xs, paddingVertical: Spacing.md },
  avatar: {
    height: 84,
    width: 84,
    borderRadius: 42,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceElevated,
    marginBottom: Spacing.sm,
  },
  name: { color: Colors.text, fontSize: 20, fontWeight: '700' },
  tagline: { color: Colors.textMuted },
  card: {
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  cardTitle: { color: Colors.text, fontSize: 15, fontWeight: '700' },
  factRow: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.md },
  factLabel: { color: Colors.textMuted },
  factValue: { color: Colors.text, fontWeight: '500', flexShrink: 1, textAlign: 'right' },
});
