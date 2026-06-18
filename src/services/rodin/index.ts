/**
 * Selects the active Rodin provider. Real Hyper3D provider when an API key is
 * configured, otherwise the in-memory mock so the full UX works offline.
 */
import { mockRodinProvider } from './MockRodinProvider';
import { realRodinProvider } from './RealRodinProvider';
import type { RodinProvider } from './RodinProvider';

export function getRodinProvider(): RodinProvider {
  const hasKey = Boolean(process.env.RODIN_API_KEY ?? process.env.HYPER3D_API_KEY);
  return hasKey ? realRodinProvider : mockRodinProvider;
}

export type { RodinProvider } from './RodinProvider';
