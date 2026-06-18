/**
 * Cross-runtime classification results store (native). See `chat.ts` for the
 * rationale behind `createSharedStore`.
 */
import { createSharedStore } from '@react-native-runtimes/state';

import { INITIAL_PREDICTIONS_SURFACE, type PredictionsSurfaceState } from './types';

const store = createSharedStore<PredictionsSurfaceState>({
  name: 'predictions-surface',
  initialState: INITIAL_PREDICTIONS_SURFACE,
});

export function setPredictionsSurface(next: PredictionsSurfaceState): void {
  void store.setState(next, true);
}

export function usePredictionsSurface(): PredictionsSurfaceState {
  return store.useStore();
}
