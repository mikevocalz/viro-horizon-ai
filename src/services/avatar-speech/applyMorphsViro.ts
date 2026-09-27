/**
 * Viro morph applier.
 *
 * The engine emits morphs as `Record<string, number>`. Viro3DObject's
 * `morphTargets` prop (verified against the installed .d.ts) takes
 * `Array<{ target: string; weight: number }>` instead — so we convert here
 * and push via setNativeProps, never React state.
 *
 * The reusable array is mutated in place per frame to avoid GC churn at
 * 60–90 fps. Length is sized to the rig's stable morph set on first call.
 */

import type { ComponentRef } from 'react';

type ViroMorphEntry = { target: string; weight: number };

export interface ViroMorphTarget {
  setNativeProps: (props: { morphTargets: ViroMorphEntry[] }) => void;
}

export interface ViroMorphPusher {
  /** Call every frame from `useAvatarSpeech`'s onMorphs. */
  push: (morphs: Record<string, number>) => void;
}

/**
 * Build a pusher bound to a Viro3DObject ref. Pass the same ref you give to
 * the <Viro3DObject /> component.
 */
export function createViroMorphPusher(
  ref: { current: ViroMorphTarget | null }
): ViroMorphPusher {
  let buf: ViroMorphEntry[] | null = null;
  let names: string[] = [];

  return {
    push(morphs) {
      const node = ref.current;
      if (!node || typeof node.setNativeProps !== 'function') return;

      const keys = Object.keys(morphs);
      // Resize/rebuild only when the morph set changes (e.g. idle layer adds blink).
      if (!buf || keys.length !== buf.length || !sameKeys(keys, names)) {
        buf = keys.map((target) => ({ target, weight: morphs[target] }));
        names = keys;
      } else {
        for (let i = 0; i < buf.length; i++) buf[i].weight = morphs[names[i]];
      }
      node.setNativeProps({ morphTargets: buf });
    },
  };
}

function sameKeys(a: string[], b: string[]): boolean {
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

export type ViroObjectRef = ComponentRef<any>;
