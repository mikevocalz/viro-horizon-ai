/**
 * Cross-runtime classification results store (web fallback).
 */
import { create } from 'zustand';

import { INITIAL_PREDICTIONS_SURFACE, type PredictionsSurfaceState } from './types';

const useStore = create<PredictionsSurfaceState>(() => INITIAL_PREDICTIONS_SURFACE);

export function setPredictionsSurface(next: PredictionsSurfaceState): void {
  useStore.setState(next, true);
}

export function usePredictionsSurface(): PredictionsSurfaceState {
  return useStore();
}
