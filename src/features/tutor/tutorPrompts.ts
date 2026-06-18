/**
 * Tutor system prompt + the deterministic planners that turn a parsed homework
 * scan into an XRScenePlan and a Rodin generation prompt.
 *
 * The LLM (tutor) decides *whether* to offer XR and does the Socratic tutoring;
 * these helpers produce the concrete, typed scene/asset plan so the XR scene can
 * open instantly with procedural placeholders before any generation finishes.
 */
import type {
  HomeworkParseResult,
} from '@/features/homework/schemas';
import type {
  HomeworkQuestion,
  HomeworkScan,
  RodinAssetTarget,
  RodinGenerationPlan,
  SceneType,
  XRSceneEntity,
  XRScenePlan,
} from '@/features/homework/types';

export const TUTOR_SYSTEM_PROMPT = `You are an AI homework tutor. Your job is to help the student learn, not simply give final homework answers. Use the scanned homework, detected question, tutoring plan, hint ladder, and XR scene state. Ask one guiding question at a time. If an XR scene would help, offer a clear "Study in XR" option. If the student opens XR, continue tutoring through the 3D model. Do not reveal the final answer first. Give hints progressively. Encourage the student to try. If the student is frustrated, simplify the explanation. If the scan is unclear, ask for clarification. Never fabricate facts.`;

const SOLAR_KEYWORDS = [
  'planet',
  'planets',
  'solar system',
  'solar',
  'inner planets',
  'outer planets',
  'orbit',
  'orbital',
  'rotation',
  'rocky planets',
  'gas giants',
  'astronomy',
  'mercury',
  'venus',
  'earth',
  'mars',
  'jupiter',
  'saturn',
  'uranus',
  'neptune',
  'sun',
];

/** Detects which (currently supported) XR scene best fits the homework. */
export function detectSceneType(parse: Pick<HomeworkParseResult, 'topic' | 'keywords'>): SceneType {
  const haystack = [parse.topic, ...parse.keywords].join(' ').toLowerCase();
  if (SOLAR_KEYWORDS.some((k) => haystack.includes(k))) {
    return 'solar_system';
  }
  // Other scene types (geometry/molecule/anatomy/…) are planned but not yet
  // generated; treat as "none" so we never offer XR we can't render.
  return 'none';
}

type PlanetSeed = {
  id: string;
  name: string;
  group: 'star' | 'inner' | 'outer';
  color: string;
  scale: number;
  infoCard: string;
};

const SOLAR_SEEDS: PlanetSeed[] = [
  { id: 'sun', name: 'Sun', group: 'star', color: '#F5B14C', scale: 0.34, infoCard: 'The star at the center. Everything orbits it. How might distance from it affect a planet?' },
  { id: 'mercury', name: 'Mercury', group: 'inner', color: '#9AA6C2', scale: 0.06, infoCard: 'Closest to the Sun. Small and rocky. What does "rocky" suggest about its surface?' },
  { id: 'venus', name: 'Venus', group: 'inner', color: '#E0B070', scale: 0.09, infoCard: 'Similar size to Earth, very hot. Why might a thick atmosphere trap heat?' },
  { id: 'earth', name: 'Earth', group: 'inner', color: '#36E0C8', scale: 0.095, infoCard: 'Our home. Rocky, with liquid water. Compare its size to Mars.' },
  { id: 'mars', name: 'Mars', group: 'inner', color: '#FF6B6B', scale: 0.075, infoCard: 'The red planet. Rocky and smaller than Earth. What colour hints at its surface?' },
  { id: 'jupiter', name: 'Jupiter', group: 'outer', color: '#C9A07A', scale: 0.22, infoCard: 'Largest planet, a gas giant. How does its size compare to the rocky planets?' },
  { id: 'saturn', name: 'Saturn', group: 'outer', color: '#E8D9A0', scale: 0.2, infoCard: 'Famous for its rings. Also a gas giant. What is it mostly made of?' },
  { id: 'uranus', name: 'Uranus', group: 'outer', color: '#8FD3E8', scale: 0.16, infoCard: 'An ice giant that rotates on its side. Why might that be unusual?' },
  { id: 'neptune', name: 'Neptune', group: 'outer', color: '#6C8BFF', scale: 0.155, infoCard: 'Farthest planet, very cold and windy. How does distance relate to temperature?' },
];

function buildSolarEntities(): XRSceneEntity[] {
  return SOLAR_SEEDS.map((seed, i) => ({
    id: seed.id,
    name: seed.name,
    placeholder: 'sphere',
    group: seed.group,
    // Lay the system out along x in front of the viewer.
    position: seed.group === 'star' ? [-1.5, 0, -2.2] : [-1.2 + i * 0.32, 0, -2],
    scale: seed.scale,
    color: seed.color,
    infoCard: seed.infoCard,
  }));
}

function buildSolarAssetTargets(): RodinAssetTarget[] {
  return SOLAR_SEEDS.map((seed) => ({
    id: `target-${seed.id}`,
    name: seed.name,
    type: seed.group === 'star' ? 'star' : 'planet',
    description: `${seed.name} — ${seed.group === 'star' ? 'central star' : `${seed.group} ${seed.group === 'inner' ? 'rocky planet' : 'gas/ice giant'}`}, educational proportions, clean silhouette.`,
    required: seed.id === 'sun' || seed.id === 'earth',
    placeholder: 'sphere',
    entityId: seed.id,
  }));
}

/** Builds a Rodin prompt, adding context the homework specifically asks about. */
export function buildRodinPrompt(parse: Pick<HomeworkParseResult, 'topic' | 'keywords'>): string {
  const haystack = [parse.topic, ...parse.keywords].join(' ').toLowerCase();
  const extras: string[] = [];
  if (haystack.includes('inner') || haystack.includes('rocky')) {
    extras.push('Emphasize the inner rocky planets (Mercury, Venus, Earth, Mars).');
  }
  if (haystack.includes('outer') || haystack.includes('gas giant')) {
    extras.push('Emphasize the outer gas/ice giants (Jupiter, Saturn, Uranus, Neptune).');
  }
  if (haystack.includes('orbit') || haystack.includes('order')) {
    extras.push('Make orbital order legible from the Sun outward.');
  }
  if (haystack.includes('rotation')) {
    extras.push('Model each body as a separate object so rotation can be animated per planet.');
  }
  if (haystack.includes('earth') && haystack.includes('mars')) {
    extras.push('Keep Earth and Mars to accurate relative size for direct comparison.');
  }
  return [
    'Generate an educational stylized-realistic 3D solar system model pack for a middle school science homework lesson.',
    'Include the Sun and eight planets with clearly distinguishable visual features.',
    'Emphasize inner rocky planets versus outer gas giants.',
    'Use clean educational proportions, mobile-friendly geometry, readable silhouettes, and separate objects suitable for GLB export.',
    'Do not include text labels in the mesh. Do not create a full 10M polygon runtime scene. Assets will be optimized for mobile XR.',
    ...extras,
  ].join(' ');
}

function buildRodinPlan(scenePlanId: string, parse: Pick<HomeworkParseResult, 'topic' | 'keywords'>): RodinGenerationPlan {
  return {
    id: `rodin-${scenePlanId}`,
    scenePlanId,
    provider: 'rodin',
    status: 'idle',
    prompt: buildRodinPrompt(parse),
    negativePrompt: 'text, labels, watermark, ultra-high polygon density, scene clutter',
    assetTargets: buildSolarAssetTargets(),
    quality: 'standard',
    mobileBudget: {
      maxTrianglesPerAsset: 40000,
      maxTextureSize: 1024,
      useLODs: true,
      useCompressedTextures: true,
    },
  };
}

const SOLAR_OFFER =
  'I can help you study this in 3D. Since your homework is about the solar system, I can build an XR model where you can tap planets, compare inner vs outer planets, and answer questions step by step. Want to open it?';

/**
 * Deterministically builds an XRScenePlan from a parsed scan. Returns a plan with
 * `shouldOfferXR: false` and `sceneType: 'none'` for topics we can't render yet.
 */
export function buildXRScenePlan(
  scan: HomeworkScan,
  questions: HomeworkQuestion[],
  parse: Pick<HomeworkParseResult, 'topic' | 'keywords'>,
): XRScenePlan {
  const sceneType = detectSceneType(parse);
  const id = `scene-${scan.id}`;
  const questionIds = questions.map((q) => q.id);

  if (sceneType !== 'solar_system') {
    return {
      id,
      homeworkScanId: scan.id,
      sceneType: 'none',
      title: scan.topic,
      learningGoal: `Understand: ${scan.topic}`,
      homeworkQuestionIds: questionIds,
      shouldOfferXR: false,
      offerMessage: '',
      ctaLabel: 'Study in XR',
      entities: [],
      interactions: [],
      rodinGenerationRequired: false,
    };
  }

  const entities = buildSolarEntities();
  return {
    id,
    homeworkScanId: scan.id,
    sceneType: 'solar_system',
    title: 'Solar System',
    learningGoal: 'Compare the inner rocky planets with the outer gas giants and their order from the Sun.',
    homeworkQuestionIds: questionIds,
    shouldOfferXR: true,
    offerMessage: SOLAR_OFFER,
    ctaLabel: 'Study in XR',
    entities,
    interactions: entities
      .filter((e) => e.group !== 'star')
      .map((e) => ({
        id: `tap-${e.id}`,
        entityId: e.id,
        type: 'tap',
        prompt: `Look at ${e.name}. ${e.infoCard}`,
      })),
    rodinGenerationRequired: true,
    rodinGenerationPlan: buildRodinPlan(id, parse),
  };
}
