/**
 * Real Rodin (Hyper3D) provider — https://developer.hyper3d.ai/
 *
 * API (v2):
 *  - POST {BASE}/rodin     multipart form, `Authorization: Bearer <key>`
 *      fields: prompt, tier, geometry_file_format=glb, material, mesh_mode,
 *      quality_override → { uuid, jobs: { subscription_key } }
 *  - POST {BASE}/status    { subscription_key } → job status ('Done' | 'Failed' | …)
 *  - POST {BASE}/download  { task_uuid } → { list: [{ name, url }] }  (pick .glb)
 *
 * One scene plan fans out to one Rodin task per asset target (e.g. Sun + planets)
 * so each becomes a separate GLB that swaps into the scene independently. State is
 * held in a process-local map (dev server). This runs server-side from the API
 * routes — never import it into a component.
 *
 * Enabled when `RODIN_API_KEY` (or `HYPER3D_API_KEY`) is set; otherwise the routes
 * use MockRodinProvider. See getRodinProvider().
 *
 * TODO(rodin): confirm Gen-2.5 `tier` string + status JSON shape against your
 * account; add the mesh-optimization stage (decimate/LOD/texture compress) before
 * returning `optimizedGlbUri` — currently the raw GLB url is passed through.
 */
import type {
  GeneratedXRAsset,
  RodinGenerationPlan,
  RodinStartResult,
  XRGenerationJob,
} from './types';
import type { RodinProvider } from './RodinProvider';

const BASE = process.env.RODIN_API_BASE ?? 'https://api.hyper3d.com/api/v2';
// Rodin Gen-2.5. Override with RODIN_TIER if your account uses a different label.
const TIER = process.env.RODIN_TIER ?? 'Gen-2.5';

type Task = {
  entityId: string;
  name: string;
  taskUuid: string;
  subscriptionKey: string;
  done: boolean;
  asset?: GeneratedXRAsset;
};

type Job = { plan: RodinGenerationPlan; tasks: Task[] };

function authHeaders(): Record<string, string> {
  const key = process.env.RODIN_API_KEY ?? process.env.HYPER3D_API_KEY ?? '';
  return { Authorization: `Bearer ${key}` };
}

class RealRodinProviderImpl implements RodinProvider {
  private jobs = new Map<string, Job>();

  async startGeneration(plan: RodinGenerationPlan): Promise<RodinStartResult> {
    const jobId = `rodin-${plan.id}-${Date.now()}`;
    const tasks: Task[] = [];
    for (const target of plan.assetTargets) {
      const form = new FormData();
      form.append('prompt', `${plan.prompt} Asset: ${target.description}`);
      form.append('tier', TIER);
      form.append('geometry_file_format', 'glb');
      form.append('material', 'PBR');
      form.append('mesh_mode', 'Raw');
      const res = await fetch(`${BASE}/rodin`, {
        method: 'POST',
        headers: authHeaders(),
        body: form,
      });
      if (!res.ok) {
        throw new Error(`Rodin start failed (${res.status}) for ${target.name}`);
      }
      const data = (await res.json()) as {
        uuid: string;
        jobs?: { subscription_key?: string };
      };
      tasks.push({
        entityId: target.entityId,
        name: target.name,
        taskUuid: data.uuid,
        subscriptionKey: data.jobs?.subscription_key ?? '',
        done: false,
      });
    }
    this.jobs.set(jobId, { plan, tasks });
    return { jobId };
  }

  async getGenerationStatus(jobId: string): Promise<XRGenerationJob> {
    const job = this.jobs.get(jobId);
    if (!job) {
      return {
        id: jobId,
        homeworkScanId: '',
        scenePlanId: '',
        status: 'failed',
        progress: 0,
        message: 'Unknown job',
        assets: [],
        error: 'Unknown job',
      };
    }

    for (const task of job.tasks) {
      if (task.done) {
        continue;
      }
      const state = await this.pollTask(task);
      if (state === 'Done') {
        task.done = true;
        task.asset = await this.downloadAsset(job.plan, task);
      } else if (state === 'Failed') {
        task.done = true; // stop polling; leave asset undefined
      }
    }

    const doneCount = job.tasks.filter((t) => t.done).length;
    const assets = job.tasks.flatMap((t) => (t.asset ? [t.asset] : []));
    const allDone = doneCount === job.tasks.length;
    const anyFailed = job.tasks.some((t) => t.done && !t.asset);

    return {
      id: jobId,
      homeworkScanId: '',
      scenePlanId: job.plan.scenePlanId,
      status: allDone ? (assets.length > 0 ? 'ready' : 'failed') : 'generating',
      progress: job.tasks.length ? doneCount / job.tasks.length : 0,
      message: allDone
        ? assets.length > 0
          ? 'Model ready'
          : 'Generation failed'
        : 'Building your solar system model…',
      assets,
      error: anyFailed && assets.length === 0 ? 'Rodin generation failed' : undefined,
    };
  }

  async getGeneratedAssets(jobId: string): Promise<GeneratedXRAsset[]> {
    const job = this.jobs.get(jobId);
    return job ? job.tasks.flatMap((t) => (t.asset ? [t.asset] : [])) : [];
  }

  private async pollTask(task: Task): Promise<string> {
    const res = await fetch(`${BASE}/status`, {
      method: 'POST',
      headers: { ...authHeaders(), 'content-type': 'application/json' },
      body: JSON.stringify({ subscription_key: task.subscriptionKey }),
    });
    if (!res.ok) {
      return 'Pending';
    }
    // The status payload nests per-job statuses; accept either shape defensively.
    const data = (await res.json()) as {
      status?: string;
      jobs?: Array<{ status?: string }>;
    };
    return data.status ?? data.jobs?.[0]?.status ?? 'Pending';
  }

  private async downloadAsset(
    plan: RodinGenerationPlan,
    task: Task,
  ): Promise<GeneratedXRAsset | undefined> {
    const res = await fetch(`${BASE}/download`, {
      method: 'POST',
      headers: { ...authHeaders(), 'content-type': 'application/json' },
      body: JSON.stringify({ task_uuid: task.taskUuid }),
    });
    if (!res.ok) {
      return undefined;
    }
    const data = (await res.json()) as { list?: Array<{ name: string; url: string }> };
    const glb = data.list?.find((f) => f.name.toLowerCase().endsWith('.glb'));
    if (!glb) {
      return undefined;
    }
    return {
      id: `asset-${task.taskUuid}`,
      entityId: task.entityId,
      name: task.name,
      sourceProvider: 'rodin',
      rawUri: glb.url,
      // TODO(rodin): run the optimization stage and point this at the optimized GLB.
      optimizedGlbUri: glb.url,
      triangleCount: plan.mobileBudget.maxTrianglesPerAsset,
      textureSize: plan.mobileBudget.maxTextureSize,
      createdAt: new Date().toISOString(),
    };
  }
}

export const realRodinProvider = new RealRodinProviderImpl();
