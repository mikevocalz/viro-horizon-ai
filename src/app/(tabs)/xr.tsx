/**
 * Immersive XR layer (ViroReact).
 *
 * Renders an AR scene with a spinning, lit "hologram" box and a title. On Meta
 * Quest / Horizon devices the AR navigator shows `questFallback` (AR camera is
 * unavailable there); the device is detected via `expo-horizon-core`.
 *
 * Web is handled by the sibling `xr.web.tsx` so the web bundle never imports
 * the native Viro module.
 */
import { useEffect } from 'react';
import { Text, View } from 'react-native';
import {
  ViroARScene,
  ViroARSceneNavigator,
  ViroAmbientLight,
  ViroAnimations,
  ViroBox,
  ViroMaterials,
  ViroText,
  type ViroTextStyle,
} from '@reactvision/react-viro';

import { GradientHeader } from '@/components/GradientHeader';
import { ScreenContainer } from '@/components/ScreenContainer';
import { haptics } from '@/lib/haptics';
import { isHorizonDevice } from '@/lib/horizon';

ViroMaterials.createMaterials({
  hologram: {
    lightingModel: 'Blinn',
    diffuseColor: '#6C8BFF',
  },
});

ViroAnimations.registerAnimations({
  spin: {
    properties: { rotateY: '+=360' },
    duration: 4000,
  },
});

const viroTextStyle: ViroTextStyle = {
  fontSize: 28,
  fontWeight: '700',
  color: '#F2F5FF',
  textAlign: 'center',
  textAlignVertical: 'center',
};

function XrScene() {
  return (
    <ViroARScene>
      <ViroAmbientLight color="#FFFFFF" intensity={300} />
      <ViroText
        text="Viro Horizon AI"
        position={[0, 0.4, -1.6]}
        scale={[0.5, 0.5, 0.5]}
        style={viroTextStyle}
      />
      <ViroBox
        position={[0, -0.2, -1.6]}
        scale={[0.35, 0.35, 0.35]}
        materials={['hologram']}
        animation={{ name: 'spin', run: true, loop: true }}
      />
    </ViroARScene>
  );
}

export default function XrScreen() {
  useEffect(() => {
    haptics.immersive();
  }, []);

  const onHorizon = isHorizonDevice();

  return (
    <ScreenContainer>
      <GradientHeader
        title="Immersive XR"
        subtitle={onHorizon ? 'Meta Quest · Horizon OS' : 'ViroReact · AR'}
        gradient="ember"
        height={120}
      />
      <View className="flex-1">
        <ViroARSceneNavigator
          initialScene={{ scene: XrScene }}
          style={{ flex: 1 }}
          questFallback={
            <View className="flex-1 items-center justify-center gap-2 bg-background p-6">
              <Text className="text-lg font-bold text-text">Horizon device detected</Text>
              <Text className="text-center text-muted">
                AR passthrough is unavailable on Quest. Build a VR target to render this scene
                immersively.
              </Text>
            </View>
          }
        />
      </View>
    </ScreenContainer>
  );
}
