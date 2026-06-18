/**
 * XR tab — renders the homework-driven generated scene router. Web is handled by
 * `xr.web.tsx` (Viro is native-only).
 */
import { XRSceneRouter } from '@/features/xr/XRSceneRouter';

export default function XrRoute() {
  return <XRSceneRouter />;
}
