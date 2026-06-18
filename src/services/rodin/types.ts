/**
 * Rodin provider I/O types. The domain shapes (plan, job, asset) live in
 * `src/features/homework/types.ts`; this file only adds provider-call types.
 */
export type {
  GeneratedXRAsset,
  RodinGenerationPlan,
  XRGenerationJob,
} from '@/features/homework/types';

export interface RodinStartResult {
  jobId: string;
}
