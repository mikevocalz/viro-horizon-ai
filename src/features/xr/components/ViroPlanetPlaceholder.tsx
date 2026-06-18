/**
 * Procedural placeholder for a scene entity: a colored sphere + label, shown
 * immediately while the Rodin GLB is still generating. Material `planet-<id>`
 * must be registered by the scene before render (see SolarSystemGeneratedScene).
 */
import { ViroNode, ViroSphere, ViroText, type ViroTextStyle } from '@reactvision/react-viro';

import type { XRSceneEntity } from '@/features/homework/types';

const labelStyle: ViroTextStyle = {
  fontSize: 12,
  color: '#F2F5FF',
  textAlign: 'center',
  textAlignVertical: 'center',
};

type Props = {
  entity: XRSceneEntity;
  selected?: boolean;
  onPress?: (entityId: string) => void;
};

export function ViroPlanetPlaceholder({ entity, selected, onPress }: Props) {
  const radius = entity.scale * (selected ? 1.25 : 1);
  return (
    <ViroNode position={entity.position}>
      <ViroSphere
        radius={radius}
        materials={[`planet-${entity.id}`]}
        animation={{ name: 'spin', run: true, loop: true }}
        onClick={() => onPress?.(entity.id)}
      />
      <ViroText
        text={entity.name}
        position={[0, radius + 0.06, 0]}
        scale={[0.2, 0.2, 0.2]}
        style={labelStyle}
      />
    </ViroNode>
  );
}
