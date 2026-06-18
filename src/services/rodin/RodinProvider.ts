/**
 * Provider seam for 3D generation. Components/clients depend on this interface,
 * never on a concrete provider, so a real Rodin (Gen-2.5) implementation can
 * drop in behind it without touching the XR scene or the store.
 */
import type {
  GeneratedXRAsset,
  RodinGenerationPlan,
  RodinStartResult,
  XRGenerationJob,
} from './types';

export interface RodinProvider {
  /** Kicks off a generation job for the given plan; resolves with a job id. */
  startGeneration(plan: RodinGenerationPlan): Promise<RodinStartResult>;
  /** Current job status, progress, message, and any assets ready so far. */
  getGenerationStatus(jobId: string): Promise<XRGenerationJob>;
  /** Optimized, mobile-safe assets ready for the runtime. */
  getGeneratedAssets(jobId: string): Promise<GeneratedXRAsset[]>;
}
