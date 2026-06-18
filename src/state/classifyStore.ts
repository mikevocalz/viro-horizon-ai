/**
 * Image-classification screen state: the picked image and ranked predictions.
 */
import { create } from 'zustand';

export type Prediction = { label: string; score: number };

type ClassifyStore = {
  imageUri: string | null;
  predictions: Prediction[];
  setImage: (uri: string) => void;
  setPredictions: (predictions: Prediction[]) => void;
};

export const useClassifyStore = create<ClassifyStore>((set) => ({
  imageUri: null,
  predictions: [],
  setImage: (uri) => set({ imageUri: uri, predictions: [] }),
  setPredictions: (predictions) => set({ predictions }),
}));
