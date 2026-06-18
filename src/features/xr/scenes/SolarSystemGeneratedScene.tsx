/**
 * Solar system generated XR scene.
 *
 * Opens instantly with procedural sphere placeholders (+ labels, lights, spin),
 * then swaps each placeholder for its Rodin-generated GLB as it streams into the
 * store — without resetting the scene or losing the selected planet. Tapping a
 * body drives the floating tutor panel with a Socratic hint.
 */
import {
  ViroAmbientLight,
  ViroARScene,
  ViroAnimations,
  ViroImage,
  ViroMaterials,
  ViroOmniLight,
  ViroText,
  type ViroStyle,
  type ViroTextStyle,
} from '@reactvision/react-viro';

import { useHomeworkStore } from '@/features/homework/homeworkStore';
import type { XRSceneEntity } from '@/features/homework/types';
import { GeneratedModelSlot } from '../components/GeneratedModelSlot';
import { ViroHomeworkTutorPanel } from '../components/ViroHomeworkTutorPanel';

ViroAnimations.registerAnimations({
  spin: { properties: { rotateY: '+=360' }, duration: 12000 },
});

const registered = new Set<string>();
function registerEntityMaterials(entities: XRSceneEntity[]): void {
  const next: Record<string, { diffuseColor: string; lightingModel: 'Blinn' }> = {};
  let added = false;
  for (const e of entities) {
    const key = `planet-${e.id}`;
    if (!registered.has(key)) {
      next[key] = { diffuseColor: e.color, lightingModel: 'Blinn' };
      registered.add(key);
      added = true;
    }
  }
  if (added) {
    ViroMaterials.createMaterials(next);
  }
}

const refImageStyle: ViroStyle = { width: 0.8, height: 0.6 };
const refLabelStyle: ViroTextStyle = {
  fontSize: 11,
  color: '#9AA6C2',
  textAlign: 'center',
  textAlignVertical: 'center',
};

export function SolarSystemGeneratedScene() {
  const plan = useHomeworkStore((s) => s.xrScenePlan);
  const scan = useHomeworkStore((s) => s.activeHomeworkScan);
  const assets = useHomeworkStore((s) => s.xrAssetsByEntityId);
  const errors = useHomeworkStore((s) => s.xrAssetErrorByEntityId);
  const selectedId = useHomeworkStore((s) => s.selectedEntityId);
  const setSelected = useHomeworkStore((s) => s.setSelectedEntity);
  const setAssetLoadError = useHomeworkStore((s) => s.setAssetLoadError);

  const referenceImageUri = scan?.referenceImageUri;
  const entities = plan?.entities ?? [];
  registerEntityMaterials(entities);

  const selected = entities.find((e) => e.id === selectedId);
  const tutorText = selected
    ? `${selected.name}: ${selected.infoCard}`
    : plan?.learningGoal ?? 'Tap a planet to explore it.';

  return (
    <ViroARScene>
      <ViroAmbientLight color="#FFFFFF" intensity={250} />
      <ViroOmniLight
        position={[-1.5, 0, -2]}
        color="#FFF3D6"
        intensity={900}
        attenuationStartDistance={1}
        attenuationEndDistance={10}
      />
      {entities.map((e) => (
        <GeneratedModelSlot
          key={e.id}
          entity={e}
          assetUri={assets[e.id]?.optimizedGlbUri}
          hasError={Boolean(errors[e.id])}
          selected={e.id === selectedId}
          onPress={setSelected}
          onLoadError={setAssetLoadError}
        />
      ))}
      {referenceImageUri ? (
        <>
          <ViroImage
            source={{ uri: referenceImageUri }}
            position={[1.4, 0.5, -2]}
            style={refImageStyle}
            resizeMode="ScaleToFit"
          />
          <ViroText
            text="From your homework"
            position={[1.4, 0.12, -2]}
            scale={[0.2, 0.2, 0.2]}
            style={refLabelStyle}
          />
        </>
      ) : null}

      <ViroHomeworkTutorPanel text={tutorText} />
    </ViroARScene>
  );
}
