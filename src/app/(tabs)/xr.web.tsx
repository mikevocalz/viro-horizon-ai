/**
 * Web fallback for the XR tab.
 *
 * ViroReact is native-only, so the web bundle renders an explanatory notice
 * instead of importing `@reactvision/react-viro`.
 */
import { Text, View } from 'react-native';

import { GradientHeader } from '@/components/GradientHeader';
import { ScreenContainer } from '@/components/ScreenContainer';

export default function XrWebScreen() {
  return (
    <ScreenContainer>
      <GradientHeader title="Immersive XR" subtitle="ViroReact" gradient="ember" height={120} />
      <View className="flex-1 items-center justify-center gap-2 p-6">
        <Text className="text-lg font-bold text-text">Native only</Text>
        <Text className="max-w-[360px] text-center text-muted">
          The XR layer runs on iOS, Android, and Meta Quest. Open the app on a device or simulator
          to explore the immersive scene.
        </Text>
      </View>
    </ScreenContainer>
  );
}
