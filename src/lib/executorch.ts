/**
 * On-device AI runtime wiring.
 *
 * `react-native-executorch` needs a single resource fetcher registered before
 * any model hook runs. In an Expo project that fetcher comes from
 * `react-native-executorch-expo-resource-fetcher`. We register it exactly once
 * (see the root layout) and expose the model configs used across the app.
 */
import { initExecutorch, isAvailable, models } from 'react-native-executorch';
import { ExpoResourceFetcher } from 'react-native-executorch-expo-resource-fetcher';

let didInit = false;

/**
 * Idempotently registers the Expo resource fetcher with ExecuTorch.
 * Safe to call multiple times; only the first call has an effect.
 */
export function setupExecutorch(): void {
  if (didInit) {
    return;
  }
  initExecutorch({ resourceFetcher: ExpoResourceFetcher });
  didInit = true;
}

/** Whether the native ExecuTorch runtime is loadable on this device. */
export const executorchAvailable = isAvailable;

/**
 * Chat model. Qwen3 0.6B is the smallest fully-featured chat model in the
 * registry, which keeps the first-run download reasonable on-device.
 */
export const CHAT_MODEL = models.llm.qwen3_0_6b();

/**
 * Image classification model. EfficientNet V2 (S) over the ImageNet-1k labels.
 */
export const CLASSIFICATION_MODEL = models.classification.efficientnet_v2_s();
