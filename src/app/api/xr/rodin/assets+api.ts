/** Returns the optimized, mobile-safe GLB assets for a Rodin job. */
import { getRodinProvider } from '@/services/rodin';

export async function GET(request: Request): Promise<Response> {
  const jobId = new URL(request.url).searchParams.get('jobId');
  if (!jobId) {
    return new Response('jobId required', { status: 400 });
  }
  const assets = await getRodinProvider().getGeneratedAssets(jobId);
  return Response.json(assets);
}
