/**
 * Web fallback for the XR tab.
 *
 * ViroReact is native-only, so the web bundle renders an explanatory notice
 * instead of importing `@reactvision/react-viro`.
 */
import { StyleSheet, Text, View } from 'react-native';

import { GradientHeader } from '@/components/GradientHeader';
import { ScreenContainer } from '@/components/ScreenContainer';
import { Colors, Spacing } from '@/constants/theme';

export default function XrWebScreen() {
  return (
    <ScreenContainer>
      <GradientHeader title="Immersive XR" subtitle="ViroReact" gradient="ember" height={120} />
      <View style={styles.notice}>
        <Text style={styles.noticeTitle}>Native only</Text>
        <Text style={styles.noticeText}>
          The XR layer runs on iOS, Android, and Meta Quest. Open the app on a
          device or simulator to explore the immersive scene.
        </Text>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  notice: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    padding: Spacing.xl,
  },
  noticeTitle: { color: Colors.text, fontSize: 18, fontWeight: '700' },
  noticeText: { color: Colors.textMuted, textAlign: 'center', maxWidth: 360 },
});
