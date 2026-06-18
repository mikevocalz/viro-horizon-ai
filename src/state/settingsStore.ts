/**
 * Global feedback settings. The setters also drive the Pulsar engine so the
 * toggles take effect immediately and stay consistent across screens.
 */
import { create } from 'zustand';
import { Settings as PulsarSettings } from 'react-native-pulsar';

type SettingsStore = {
  hapticsEnabled: boolean;
  soundEnabled: boolean;
  setHapticsEnabled: (enabled: boolean) => void;
  setSoundEnabled: (enabled: boolean) => void;
};

export const useSettingsStore = create<SettingsStore>((set) => ({
  hapticsEnabled: true,
  soundEnabled: false,
  setHapticsEnabled: (enabled) => {
    PulsarSettings.enableHaptics(enabled);
    set({ hapticsEnabled: enabled });
  },
  setSoundEnabled: (enabled) => {
    PulsarSettings.enableSound(enabled);
    set({ soundEnabled: enabled });
  },
}));
