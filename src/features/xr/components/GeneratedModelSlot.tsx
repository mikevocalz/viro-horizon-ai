/**
 * Renders a generated GLB when its asset is ready, otherwise the procedural
 * placeholder. On GLB load error it reverts to the placeholder via the store, so
 * the scene is never blank and offline/failed generation degrades gracefully.
 */
import { Viro3DObject } from '@reactvision/react-viro';

import type { XRSceneEntity } from '@/features/homework/types';
import { ViroPlanetPlaceholder } from './ViroPlanetPlaceholder';

type Props = {
  entity: XRSceneEntity;
  assetUri?: string;
  hasError?: boolean;
  selected?: boolean;
  onPress?: (entityId: string) => void;
  onLoadError: (entityId: string) => void;
};

export function GeneratedModelSlot({
  entity,
  assetUri,
  hasError,
  selected,
  onPress,
  onLoadError,
}: Props) {
  if (assetUri && !hasError) {
    const s = entity.scale * (selected ? 1.25 : 1);
    return (
      <Viro3DObject
        source={{ uri: assetUri }}
        type="GLB"
        position={entity.position}
        scale={[s, s, s]}
        animation={{ name: 'spin', run: true, loop: true }}
        onClick={() => onPress?.(entity.id)}
        onError={() => onLoadError(entity.id)}
      />
    );
  }
  return <ViroPlanetPlaceholder entity={entity} selected={selected} onPress={onPress} />;
}
