/**
 * Homework tutoring + generated-XR session state.
 *
 * Holds the active scan, parsed questions, tutoring plan, the XR scene plan, and
 * the live Rodin generation job. The async generation work lives in
 * `src/services/xr/xrGenerationClient.ts`; this store only holds state and the
 * mutations that drive the UI.
 */
import { create } from 'zustand';

import type {
  GeneratedXRAsset,
  HomeworkQuestion,
  HomeworkScan,
  TutorMessage,
  TutoringPlan,
  XRGenerationJob,
  XRScenePlan,
} from './types';

type HomeworkStore = {
  activeHomeworkScan: HomeworkScan | null;
  detectedQuestions: HomeworkQuestion[];
  tutoringPlan: TutoringPlan | null;
  tutorMessages: TutorMessage[];
  xrScenePlan: XRScenePlan | null;
  xrGenerationJob: XRGenerationJob | null;
  xrAssetsByEntityId: Record<string, GeneratedXRAsset>;
  /** Entities whose generated GLB failed to load (revert to placeholder). */
  xrAssetErrorByEntityId: Record<string, boolean>;
  isXRRecommended: boolean;
  /** True once the student has opened XR for the current offer. */
  xrOpened: boolean;
  /** Guards against starting generation twice for the same plan. */
  generationStarted: boolean;
  /** Entity the student has tapped in the XR scene (drives the tutor panel). */
  selectedEntityId: string | null;

  setHomeworkScan: (scan: HomeworkScan, questions: HomeworkQuestion[]) => void;
  setTutoringPlan: (plan: TutoringPlan) => void;
  addTutorMessage: (message: TutorMessage) => void;
  setXRScenePlan: (plan: XRScenePlan) => void;
  /** Idempotently begins generation; returns true if it was newly started. */
  startXRGeneration: () => boolean;
  updateXRGenerationJob: (partial: Partial<XRGenerationJob>) => void;
  setGeneratedXRAsset: (asset: GeneratedXRAsset) => void;
  setAssetLoadError: (entityId: string) => void;
  setSelectedEntity: (entityId: string) => void;
  openXRForHomework: () => void;
  resetHomeworkSession: () => void;
};

const EMPTY = {
  activeHomeworkScan: null,
  detectedQuestions: [],
  tutoringPlan: null,
  tutorMessages: [],
  xrScenePlan: null,
  xrGenerationJob: null,
  xrAssetsByEntityId: {},
  xrAssetErrorByEntityId: {},
  isXRRecommended: false,
  xrOpened: false,
  generationStarted: false,
  selectedEntityId: null,
};

export const useHomeworkStore = create<HomeworkStore>((set, get) => ({
  ...EMPTY,

  setHomeworkScan: (scan, questions) =>
    set({
      activeHomeworkScan: scan,
      detectedQuestions: questions,
      // New scan resets any prior XR session.
      xrScenePlan: null,
      xrGenerationJob: null,
      xrAssetsByEntityId: {},
      xrAssetErrorByEntityId: {},
      isXRRecommended: false,
      xrOpened: false,
      generationStarted: false,
    }),

  setTutoringPlan: (plan) => set({ tutoringPlan: plan }),

  addTutorMessage: (message) =>
    set((s) => ({ tutorMessages: [...s.tutorMessages, message] })),

  setXRScenePlan: (plan) =>
    set({ xrScenePlan: plan, isXRRecommended: plan.shouldOfferXR }),

  startXRGeneration: () => {
    const { generationStarted, xrScenePlan } = get();
    if (generationStarted || !xrScenePlan) {
      return false;
    }
    set({
      generationStarted: true,
      xrGenerationJob: {
        id: `pending-${xrScenePlan.id}`,
        homeworkScanId: xrScenePlan.homeworkScanId,
        scenePlanId: xrScenePlan.id,
        status: 'queued',
        progress: 0,
        message: 'Queued…',
        assets: [],
      },
    });
    return true;
  },

  updateXRGenerationJob: (partial) =>
    set((s) =>
      s.xrGenerationJob
        ? { xrGenerationJob: { ...s.xrGenerationJob, ...partial } }
        : s,
    ),

  setGeneratedXRAsset: (asset) =>
    set((s) => ({
      xrAssetsByEntityId: { ...s.xrAssetsByEntityId, [asset.entityId]: asset },
      xrGenerationJob: s.xrGenerationJob
        ? {
            ...s.xrGenerationJob,
            assets: [
              ...s.xrGenerationJob.assets.filter((a) => a.entityId !== asset.entityId),
              asset,
            ],
          }
        : s.xrGenerationJob,
    })),

  setAssetLoadError: (entityId) =>
    set((s) => ({
      xrAssetErrorByEntityId: { ...s.xrAssetErrorByEntityId, [entityId]: true },
    })),

  setSelectedEntity: (entityId) => set({ selectedEntityId: entityId }),

  openXRForHomework: () => set({ xrOpened: true }),

  resetHomeworkSession: () => set({ ...EMPTY }),
}));
