/**
 * Drives a Rodin generation job from the client: starts it via the API route,
 * polls status, and streams progress + assets into the homework store. The XR
 * scene only reads store state, never this client.
 */
import { fetch as expoFetch } from 'expo/fetch';

import { generateApiUrl } from '@/lib/api';
import { haptics } from '@/lib/haptics';
import { useHomeworkStore } from '@/features/homework/homeworkStore';
import type { RodinGenerationPlan, XRGenerationJob } from '@/features/homework/types';

const POLL_INTERVAL_MS = 1200;
const MAX_POLLS = 120;

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Starts generation for the plan and polls until ready/failed, updating the
 * store as progress and assets arrive. Safe to call once per plan (the store's
 * `startXRGeneration` guards double-starts).
 */
export async function runXRGeneration(plan: RodinGenerationPlan): Promise<void> {
  const store = useHomeworkStore.getState();
  try {
    const startRes = await expoFetch(generateApiUrl('/api/xr/rodin/start'), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ plan }),
    });
    if (!startRes.ok) {
      throw new Error(`start failed (${startRes.status})`);
    }
    const { jobId } = (await startRes.json()) as { jobId: string };
    store.updateXRGenerationJob({ id: jobId, status: 'queued', message: 'Queued…' });

    for (let i = 0; i < MAX_POLLS; i++) {
      const res = await expoFetch(
        generateApiUrl(`/api/xr/rodin/status?jobId=${encodeURIComponent(jobId)}`),
      );
      if (!res.ok) {
        throw new Error(`status failed (${res.status})`);
      }
      const job = (await res.json()) as XRGenerationJob;
      const current = useHomeworkStore.getState();

      current.updateXRGenerationJob({
        status: job.status,
        progress: job.progress,
        message: job.message,
        error: job.error,
      });
      for (const asset of job.assets) {
        if (!current.xrAssetsByEntityId[asset.entityId]) {
          current.setGeneratedXRAsset(asset);
        }
      }

      if (job.status === 'ready') {
        haptics.success();
        return;
      }
      if (job.status === 'failed') {
        haptics.error();
        return;
      }
      await delay(POLL_INTERVAL_MS);
    }
    store.updateXRGenerationJob({ status: 'failed', message: 'Generation timed out', error: 'timeout' });
    haptics.error();
  } catch (err) {
    useHomeworkStore.getState().updateXRGenerationJob({
      status: 'failed',
      message: 'Generation failed',
      error: err instanceof Error ? err.message : String(err),
    });
    haptics.error();
  }
}
