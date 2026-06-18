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
import { StyleSheet, Text, View } from 'react-native';
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
import { Colors, Spacing } from '@/constants/theme';
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
      <View style={styles.flex}>
        <ViroARSceneNavigator
          initialScene={{ scene: XrScene }}
          style={styles.flex}
          questFallback={
            <View style={styles.notice}>
              <Text style={styles.noticeTitle}>Horizon device detected</Text>
              <Text style={styles.noticeText}>
                AR passthrough is unavailable on Quest. Build a VR target to
                render this scene immersively.
              </Text>
            </View>
          }
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  notice: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    padding: Spacing.xl,
    backgroundColor: Colors.background,
  },
  noticeTitle: { color: Colors.text, fontSize: 18, fontWeight: '700' },
  noticeText: { color: Colors.textMuted, textAlign: 'center' },
});
