/**
 * Haptic feedback, powered by `react-native-pulsar`.
 *
 * Pulsar ships a large preset library plus a `System` namespace that maps to
 * the platform's standard impact/notification/selection generators. We expose a
 * small semantic surface so screens trigger intent ("sent a message") rather
 * than naming raw waveforms, and we centralize the one-time enable call.
 */
import { Presets, Settings } from 'react-native-pulsar';

let didEnable = false;

/**
 * Enables the haptics engine once for the app session.
 *
 * Pulsar auto-detects each device's capability level and degrades gracefully —
 * iOS Core Haptics vs. the wide spread of Android actuators — so we lean on its
 * runtime detection instead of branching per platform. We preload the rich
 * preset we use for the immersive XR cue to minimize first-play latency.
 */
export function setupHaptics(): void {
  if (didEnable) {
    return;
  }
  Settings.enableHaptics(true);
  Settings.preloadPresets(['bloom']);
  didEnable = true;
}

export const haptics = {
  /** Light tick used when switching tabs / drawer items. */
  selection: () => Presets.System.selection(),
  /** A message was committed to the conversation. */
  send: () => Presets.System.impactLight(),
  /** A generation / classification finished successfully. */
  success: () => Presets.System.notificationSuccess(),
  /** Something failed (model error, denied permission). */
  error: () => Presets.System.notificationError(),
  /** A richer flourish for entering the immersive XR layer. */
  immersive: () => Presets.bloom(),
} as const;
