/** Polls a Rodin generation job's status + any assets ready so far. */
import { getRodinProvider } from '@/services/rodin';

export async function GET(request: Request): Promise<Response> {
  const jobId = new URL(request.url).searchParams.get('jobId');
  if (!jobId) {
    return new Response('jobId required', { status: 400 });
  }
  const job = await getRodinProvider().getGenerationStatus(jobId);
  return Response.json(job);
}
