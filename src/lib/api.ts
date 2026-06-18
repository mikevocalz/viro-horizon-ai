/**
 * Resolves absolute URLs for Expo Router API routes.
 *
 * On native there is no relative origin, so we derive it from the Expo dev
 * server during development and from `EXPO_PUBLIC_API_BASE_URL` in production
 * (point that at wherever the API routes are hosted, e.g. EAS Hosting).
 */
import Constants from 'expo-constants';

export function generateApiUrl(relativePath: string): string {
  const path = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;
  const explicitBase = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (explicitBase) {
    return explicitBase.concat(path);
  }
  const origin = Constants.experienceUrl?.replace('exp://', 'http://');
  if (!origin) {
    throw new Error(
      'Set EXPO_PUBLIC_API_BASE_URL to your deployed API origin for production builds.',
    );
  }
  return origin.concat(path);
}
