/**
 * Local UI state for the homework scanner (Zustand, per the no-useState rule).
 */
import { create } from 'zustand';

export type ScannerStatus = 'idle' | 'parsing' | 'error';

type ScannerStore = {
  status: ScannerStatus;
  error: string | null;
  setStatus: (status: ScannerStatus) => void;
  setError: (error: string) => void;
  reset: () => void;
};

export const useScannerStore = create<ScannerStore>((set) => ({
  status: 'idle',
  error: null,
  setStatus: (status) => set({ status, error: status === 'error' ? null : null }),
  setError: (error) => set({ status: 'error', error }),
  reset: () => set({ status: 'idle', error: null }),
}));
