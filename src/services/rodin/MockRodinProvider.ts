/**
 * In-memory mock implementation of {@link RodinProvider}.
 *
 * Drives a realistic, time-based generation lifecycle (queued → generating →
 * optimizing → ready) and reveals optimized assets progressively, so the full
 * scan → tutor → XR → swap UX can be demonstrated with no Rodin credentials.
 *
 * Singleton (module-level) so the start/status/assets API routes share one job
 * registry within the dev server process.
 *
 * TODO(rodin): replace with `RealRodinProvider` calling Rodin Gen-2.5 — see
 * RodinProvider.ts. Keep this for offline demos/tests.
 */
import type {
  GeneratedXRAsset,
  RodinGenerationPlan,
  RodinStartResult,
  XRGenerationJob,
} from './types';
import type { RodinProvider } from './RodinProvider';

// A small, reliable sample GLB. The swap visibly replaces a placeholder sphere
// with a loaded mesh; a real provider returns per-asset planet GLBs here.
// TODO(rodin): replace with optimized, homework-specific GLB URIs.
const SAMPLE_GLB =
  'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/Box/glTF-Binary/Box.glb';

type Job = { plan: RodinGenerationPlan; startedAt: number };

const QUEUED_MS = 2000;
const GENERATING_MS = 4000;
const OPTIMIZING_MS = 3000;
const TOTAL_MS = QUEUED_MS + GENERATING_MS + OPTIMIZING_MS;

class MockRodinProviderImpl implements RodinProvider {
  private jobs = new Map<string, Job>();

  async startGeneration(plan: RodinGenerationPlan): Promise<RodinStartResult> {
    // Mock ignores the reference image; the real provider uses it (image-to-3D).
    const jobId = `mock-${plan.id}-${Date.now()}`;
    this.jobs.set(jobId, { plan, startedAt: Date.now() });
    return { jobId };
  }

  async getGenerationStatus(jobId: string): Promise<XRGenerationJob> {
    const job = this.jobs.get(jobId);
    if (!job) {
      return this.failedJob(jobId, 'Unknown job');
    }
    const elapsed = Date.now() - job.startedAt;
    const assets = this.assetsFor(job, elapsed);
    const { status, message, progress } = this.phase(elapsed);
    return {
      id: jobId,
      homeworkScanId: '',
      scenePlanId: job.plan.scenePlanId,
      status,
      progress,
      message,
      assets,
    };
  }

  async getGeneratedAssets(jobId: string): Promise<GeneratedXRAsset[]> {
    const job = this.jobs.get(jobId);
    if (!job) {
      return [];
    }
    return this.assetsFor(job, Date.now() - job.startedAt);
  }

  private phase(elapsed: number): {
    status: XRGenerationJob['status'];
    message: string;
    progress: number;
  } {
    const progress = Math.min(1, elapsed / TOTAL_MS);
    if (elapsed < QUEUED_MS) {
      return { status: 'queued', message: 'Queued…', progress };
    }
    if (elapsed < QUEUED_MS + GENERATING_MS) {
      return { status: 'generating', message: 'Building your solar system model…', progress };
    }
    if (elapsed < TOTAL_MS) {
      return { status: 'optimizing', message: 'Optimizing assets for mobile XR…', progress };
    }
    return { status: 'ready', message: 'Model ready', progress: 1 };
  }

  /** Reveals assets one-by-one through the optimizing window, all by `ready`. */
  private assetsFor(job: Job, elapsed: number): GeneratedXRAsset[] {
    const targets = job.plan.assetTargets;
    if (elapsed < QUEUED_MS + GENERATING_MS) {
      return [];
    }
    const revealWindow = elapsed - (QUEUED_MS + GENERATING_MS);
    const fraction = Math.min(1, revealWindow / OPTIMIZING_MS);
    const readyCount = Math.max(1, Math.round(fraction * targets.length));
    const budget = job.plan.mobileBudget;
    return targets.slice(0, readyCount).map((t) => ({
      id: `asset-${t.id}`,
      entityId: t.entityId,
      name: t.name,
      sourceProvider: 'rodin' as const,
      rawUri: SAMPLE_GLB,
      optimizedGlbUri: SAMPLE_GLB,
      triangleCount: Math.min(budget.maxTrianglesPerAsset, 8000),
      textureSize: Math.min(budget.maxTextureSize, 1024),
      createdAt: new Date().toISOString(),
    }));
  }

  private failedJob(jobId: string, error: string): XRGenerationJob {
    return {
      id: jobId,
      homeworkScanId: '',
      scenePlanId: '',
      status: 'failed',
      progress: 0,
      message: 'Generation failed',
      assets: [],
      error,
    };
  }
}

export const mockRodinProvider = new MockRodinProviderImpl();
