/**
 * Image-classification screen state (main runtime): the picked image URI.
 * Predictions live in the cross-runtime store (`@/state/shared/predictions`)
 * because the results list renders on a secondary runtime.
 */
import { create } from 'zustand';

type ClassifyStore = {
  imageUri: string | null;
  setImage: (uri: string) => void;
};

export const useClassifyStore = create<ClassifyStore>((set) => ({
  imageUri: null,
  setImage: (uri) => set({ imageUri: uri }),
}));
