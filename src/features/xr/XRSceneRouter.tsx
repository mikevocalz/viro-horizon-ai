/**
 * Routes the active XRScenePlan to the right generated scene. Today only
 * `solar_system` is generated; other scene types fall through to a prompt to
 * scan homework. No Horizon fallback — the scene renders on all targets.
 */
import { Text, View } from 'react-native';
import { ViroARSceneNavigator } from '@reactvision/react-viro';

import { GradientHeader } from '@/components/GradientHeader';
import { ScreenContainer } from '@/components/ScreenContainer';
import { useHomeworkStore } from '@/features/homework/homeworkStore';
import { SolarSystemGeneratedScene } from './scenes/SolarSystemGeneratedScene';
import { XRGenerationStatusPanel } from './components/XRGenerationStatusPanel';

export function XRSceneRouter() {
  const plan = useHomeworkStore((s) => s.xrScenePlan);

  if (!plan || plan.sceneType !== 'solar_system') {
    return (
      <ScreenContainer>
        <GradientHeader title="XR Study" subtitle="Homework-driven 3D" gradient="ember" height={120} />
        <View className="flex-1 items-center justify-center gap-2 p-6">
          <Text className="text-lg font-bold text-text">No XR scene yet</Text>
          <Text className="max-w-[340px] text-center text-muted">
            Scan homework about the solar system, then tap “Study in XR” in the Tutor to build it here.
          </Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <View className="flex-1">
      <ViroARSceneNavigator
        initialScene={{ scene: SolarSystemGeneratedScene }}
        style={{ flex: 1 }}
        questFallback={null}
      />
      <XRGenerationStatusPanel />
    </View>
  );
}
