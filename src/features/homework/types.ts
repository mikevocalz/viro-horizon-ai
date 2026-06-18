/**
 * Domain types for the homework-tutoring + generated-XR pipeline.
 */

export type SceneType =
  | 'solar_system'
  | 'geometry'
  | 'molecule'
  | 'anatomy'
  | 'physics'
  | 'history_artifact'
  | 'none';

export type Subject =
  | 'science'
  | 'math'
  | 'history'
  | 'language'
  | 'other';

// --- Homework scan + parsing ---

export interface HomeworkQuestion {
  id: string;
  prompt: string;
  /** Verbatim text captured for this question, if distinguishable. */
  rawText?: string;
}

export interface HomeworkScan {
  id: string;
  /** Local URI of the captured (cleaned/compressed) homework image. */
  imageUri: string;
  createdAt: string;
  subject: Subject;
  topic: string;
  /** Lowercased keywords used for XR-offer matching. */
  keywords: string[];
}

export interface TutoringPlan {
  id: string;
  homeworkScanId: string;
  learningGoal: string;
  /** Ordered Socratic steps, hint-first. */
  steps: string[];
}

export type TutorRole = 'assistant' | 'user' | 'system';

export interface TutorMessage {
  id: string;
  role: TutorRole;
  content: string;
}

// --- XR scene plan ---

export interface XRSceneEntity {
  id: string;
  name: string;
  /** Placeholder kind rendered before a generated asset is ready. */
  placeholder: 'sphere' | 'box' | 'ring' | 'text_panel';
  /** Free-form group tag, e.g. "inner" | "outer" for planets. */
  group?: string;
  /** Relative scene position [x, y, z]. */
  position: [number, number, number];
  /** Relative scale. */
  scale: number;
  /** Hex color for the procedural placeholder. */
  color: string;
  /** Short info-card body shown on tap (a hint, never the final answer). */
  infoCard: string;
}

export interface XRInteraction {
  id: string;
  entityId: string;
  type: 'tap' | 'compare' | 'highlight';
  /** Socratic question or hint surfaced by this interaction. */
  prompt: string;
}

export interface XRScenePlan {
  id: string;
  homeworkScanId: string;
  sceneType: SceneType;
  title: string;
  learningGoal: string;
  homeworkQuestionIds: string[];
  shouldOfferXR: boolean;
  offerMessage: string;
  ctaLabel: string;
  entities: XRSceneEntity[];
  interactions: XRInteraction[];
  rodinGenerationRequired: boolean;
  rodinGenerationPlan?: RodinGenerationPlan;
}

// --- Rodin generation plan ---

export type RodinStatus =
  | 'idle'
  | 'queued'
  | 'prompting'
  | 'generating'
  | 'optimizing'
  | 'uploading'
  | 'ready'
  | 'failed';

export type RodinQuality = 'draft' | 'standard' | 'high';

export interface RodinMobileBudget {
  maxTrianglesPerAsset: number;
  maxTextureSize: number;
  useLODs: boolean;
  useCompressedTextures: boolean;
}

export interface RodinAssetTarget {
  id: string;
  name: string;
  type: 'planet' | 'star' | 'orbit_system' | 'diagram' | 'artifact' | 'environment';
  description: string;
  required: boolean;
  placeholder: 'sphere' | 'box' | 'ring' | 'text_panel';
  /** Links this Rodin target to the scene entity it replaces. */
  entityId: string;
  generatedAssetUri?: string;
  optimizedAssetUri?: string;
  thumbnailUri?: string;
}

export interface RodinGenerationPlan {
  id: string;
  scenePlanId: string;
  provider: 'rodin';
  status: RodinStatus;
  prompt: string;
  negativePrompt?: string;
  assetTargets: RodinAssetTarget[];
  quality: RodinQuality;
  mobileBudget: RodinMobileBudget;
}

// --- Generation job + generated assets ---

export type XRGenerationStatus = 'queued' | 'generating' | 'optimizing' | 'ready' | 'failed';

export interface GeneratedXRAsset {
  id: string;
  entityId: string;
  name: string;
  sourceProvider: 'rodin';
  rawUri: string;
  optimizedGlbUri: string;
  triangleCount: number;
  textureSize: number;
  lodUris?: string[];
  createdAt: string;
}

export interface XRGenerationJob {
  id: string;
  homeworkScanId: string;
  scenePlanId: string;
  status: XRGenerationStatus;
  /** 0..1 */
  progress: number;
  message: string;
  assets: GeneratedXRAsset[];
  error?: string;
}

/** Lifecycle stages a generated XR scene moves through. */
export type XRSceneStage =
  | 'procedural_loading'
  | 'rodin_generating'
  | 'optimizing_assets'
  | 'generated_ready'
  | 'interactive_quiz';
