/**
 * Builds an XRScenePlan (entities, interactions, Rodin generation plan) from a
 * parsed homework scan. Deterministic so the XR scene can open instantly.
 */
import { buildXRScenePlan } from '@/features/tutor/tutorPrompts';
import type { HomeworkParseResult } from '@/features/homework/schemas';
import type { HomeworkQuestion, HomeworkScan } from '@/features/homework/types';

export async function POST(request: Request): Promise<Response> {
  const { scan, questions, parse } = (await request.json()) as {
    scan: HomeworkScan;
    questions: HomeworkQuestion[];
    parse: HomeworkParseResult;
  };
  const plan = buildXRScenePlan(scan, questions, parse);
  return Response.json(plan);
}
