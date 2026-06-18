/**
 * Starts a Rodin generation job. Uses the real Hyper3D provider when a key is
 * configured, otherwise the mock provider (see getRodinProvider).
 */
import { getRodinProvider } from '@/services/rodin';
import type { RodinGenerationPlan } from '@/features/homework/types';

export async function POST(request: Request): Promise<Response> {
  const { plan } = (await request.json()) as { plan: RodinGenerationPlan };
  const result = await getRodinProvider().startGeneration(plan);
  return Response.json(result);
}
