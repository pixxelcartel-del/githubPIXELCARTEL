import { NextResponse } from "next/server";
import { z } from "zod";
import { gradeResponses } from "@/lib/grading";

const gradeRequestSchema = z.object({
  responses: z.record(z.string(), z.string()),
  hintUsage: z.record(z.string(), z.number()).default({}),
  attemptOrder: z.array(z.string()).default([]),
  batchHistory: z.array(z.object({
    id: z.string(),
    label: z.string(),
    questionIds: z.array(z.string()),
    startedAt: z.string(),
    completedAt: z.string().optional(),
    completedQuestionIds: z.array(z.string()),
  })).default([]),
  questionTimeSeconds: z.record(z.string(), z.number()).default({}),
});

export async function POST(request: Request) {
  const parsed = gradeRequestSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  return NextResponse.json(
    gradeResponses(parsed.data.responses, {
      hintUsage: parsed.data.hintUsage,
      attemptOrder: parsed.data.attemptOrder,
      batchHistory: parsed.data.batchHistory,
      questionTimeSeconds: parsed.data.questionTimeSeconds,
    }),
  );
}
