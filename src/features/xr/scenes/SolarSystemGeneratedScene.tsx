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
  ViroMaterials,
  ViroOmniLight,
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

export function SolarSystemGeneratedScene() {
  const plan = useHomeworkStore((s) => s.xrScenePlan);
  const assets = useHomeworkStore((s) => s.xrAssetsByEntityId);
  const errors = useHomeworkStore((s) => s.xrAssetErrorByEntityId);
  const selectedId = useHomeworkStore((s) => s.selectedEntityId);
  const setSelected = useHomeworkStore((s) => s.setSelectedEntity);
  const setAssetLoadError = useHomeworkStore((s) => s.setAssetLoadError);

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
      <ViroHomeworkTutorPanel text={tutorText} />
    </ViroARScene>
  );
}
