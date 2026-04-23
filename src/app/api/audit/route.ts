import { NextResponse } from "next/server";
import { z } from "zod";
import { gradeResponses, scoreByTopic } from "@/lib/grading";

const auditRequestSchema = z.object({
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
  const parsed = auditRequestSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const grade = gradeResponses(parsed.data.responses, {
    hintUsage: parsed.data.hintUsage,
    attemptOrder: parsed.data.attemptOrder,
    batchHistory: parsed.data.batchHistory,
    questionTimeSeconds: parsed.data.questionTimeSeconds,
  });
  const topicScores = scoreByTopic(grade);
  const hintsUsed = Object.values(parsed.data.hintUsage).reduce((sum, value) => sum + value, 0);

  return NextResponse.json({
    grade,
    topicScores,
    hintsUsed,
    audit: {
      headline: "Your guided mock now has a clear practice trail.",
      timing: grade.timingNotes.join(" "),
      nextSession: grade.improvements.slice(0, 3),
      attemptOrderEfficiency: grade.attemptOrderEfficiency,
      lossPatterns: grade.lossPatterns,
    },
  });
}
