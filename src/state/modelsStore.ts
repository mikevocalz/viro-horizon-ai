/**
 * Models screen state: downloaded-file count and an in-flight clear operation.
 */
import { create } from 'zustand';

type ModelsStore = {
  fileCount: number | null;
  busy: boolean;
  setFileCount: (count: number | null) => void;
  setBusy: (busy: boolean) => void;
};

export const useModelsStore = create<ModelsStore>((set) => ({
  fileCount: null,
  busy: false,
  setFileCount: (count) => set({ fileCount: count }),
  setBusy: (busy) => set({ busy }),
}));
