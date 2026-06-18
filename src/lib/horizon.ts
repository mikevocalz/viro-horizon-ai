/**
 * Meta Quest / Horizon OS runtime helpers.
 *
 * `expo-horizon-core` exposes a native module whose `isHorizonDevice` /
 * `isHorizonBuild` are plain boolean properties. We wrap them as functions so
 * call sites read intentionally (`isHorizonDevice()`), matching the mental
 * model from the Software Mansion "Meta Quest support" guide.
 */
import ExpoHorizon from 'expo-horizon-core';

/** True when running on a physical Meta Quest / Horizon device. */
export function isHorizonDevice(): boolean {
  return ExpoHorizon.isHorizonDevice;
}

/** True when the binary was produced with the `quest` product flavor. */
export function isHorizonBuild(): boolean {
  return ExpoHorizon.isHorizonBuild;
}

/** The Horizon app id injected by the config plugin, or null when unset. */
export function getHorizonAppId(): string | null {
  return ExpoHorizon.horizonAppId;
}
