import "server-only";

import { createZeroGrade } from "@/lib/grade-view";
import { allSubQuestions, demoPaper } from "@/lib/paper-data";
import { getMarkScheme } from "@/lib/paper-mark-scheme.server";
import type { AttemptBatch, AttemptGrade, GradeAward, ResponseMap, TopicScore } from "@/lib/types";

function normalize(value: string) {
  return value
    .toLowerCase()
    .replace(/[×·]/g, "x")
    .replace(/\s+/g, " ")
    .trim();
}

function responseMatches(response: string, mark: ReturnType<typeof getMarkScheme>[number]) {
  const cleaned = normalize(response);
  if (!cleaned) {
    return { matched: false, evidence: "" };
  }

  if (mark.forbiddenContradictions?.some((candidate) => cleaned.includes(normalize(candidate)))) {
    return { matched: false, evidence: "" };
  }

  const requiredConcepts = mark.requiredConcepts ?? [];
  if (requiredConcepts.length) {
    const conceptsMet = requiredConcepts.every((group) => group.some((candidate) => cleaned.includes(normalize(candidate))));
    if (!conceptsMet) {
      return { matched: false, evidence: "" };
    }
  }

  const unitMet = !mark.unitRequirement?.length || mark.unitRequirement.some((unit) => cleaned.includes(normalize(unit)));
  if (!unitMet) {
    return { matched: false, evidence: "" };
  }

  const candidates = [...mark.acceptable, ...(mark.acceptableAlternatives ?? [])];
  for (const candidate of candidates) {
    const target = normalize(candidate);
    if (target && cleaned.includes(target)) {
      return { matched: true, evidence: candidate };
    }
  }

  const numericEvidence = numericMatch(cleaned, candidates, mark.numericTolerance);
  if (numericEvidence) {
    return { matched: true, evidence: numericEvidence };
  }

  if (requiredConcepts.length) {
    return { matched: true, evidence: requiredConcepts.map((group) => group[0]).join(" + ") };
  }

  return { matched: false, evidence: "" };
}

export function gradeResponses(
  responses: ResponseMap,
  options: {
    hintUsage?: Record<string, number>;
    attemptOrder?: string[];
    batchHistory?: AttemptBatch[];
    questionTimeSeconds?: Record<string, number>;
  } = {},
): AttemptGrade {
  const awards: GradeAward[] = allSubQuestions.map((subQuestion) => {
    const response = responses[subQuestion.id] ?? "";
    const responseBlank = response.trim().length === 0;
    const awardedPoints: string[] = [];
    const missedPoints: string[] = [];
    const evidence: string[] = [];
    let awarded = 0;
    const awardedMarkIds = new Set<string>();

    for (const mark of getMarkScheme(subQuestion.id)) {
      const dependenciesMet = (mark.dependencies ?? []).every((id) => awardedMarkIds.has(id));
      const match = dependenciesMet ? responseMatches(response, mark) : { matched: false, evidence: "" };
      if (!responseBlank && match.matched) {
        awarded += mark.marks;
        awardedMarkIds.add(mark.id);
        awardedPoints.push(mark.label);
        evidence.push(`${mark.label}: ${match.evidence || mark.evidenceHint || "clear evidence found"}`);
      } else {
        missedPoints.push(mark.label);
      }
    }

    awarded = Math.min(awarded, subQuestion.marks);

    return {
      subQuestionId: subQuestion.id,
      awarded,
      max: subQuestion.marks,
      awardedPoints,
      missedPoints,
      evidence,
      responseStatus: responseBlank ? "blank" as const : awarded >= subQuestion.marks ? "complete" as const : "partial" as const,
      confidence: responseBlank ? 1 : awardedPoints.length ? 0.82 : 0.7,
      feedback:
        responseBlank
          ? "No response evidence was submitted for this part."
          : missedPoints.length === 0
            ? "Secure response. Keep this structure for the next timed mock."
            : `Train this mark-scheme gap next: ${missedPoints.slice(0, 2).join(", ")}.`,
    };
  });

  const totalAwarded = awards.reduce((sum, award) => sum + award.awarded, 0);
  const answeredPartCount = allSubQuestions.filter((subQuestion) => responses[subQuestion.id]?.trim()).length;
  const blankPartCount = allSubQuestions.length - answeredPartCount;
  const topicScores = scoreByTopicFromAwards(awards);
  const weakSkills = awards
    .filter((award) => award.awarded < award.max && award.responseStatus !== "blank")
    .map((award) => allSubQuestions.find((item) => item.id === award.subQuestionId)?.skill)
    .filter(Boolean) as string[];
  const hintReliance = calculateHintReliance(options.hintUsage);
  const { efficiency, summary } = calculateAttemptOrderEfficiency(options.attemptOrder ?? [], options.batchHistory ?? []);

  return {
    totalAwarded,
    totalMarks: demoPaper.totalMarks,
    provenance: "deterministic",
    answeredPartCount,
    blankPartCount,
    gradingConfidence: answeredPartCount === 0
      ? 100
      : Math.round((awards.reduce((sum, award) => sum + award.confidence, 0) / awards.length) * 100),
    awards,
    strengths: answeredPartCount === 0
      ? ["No answer evidence was submitted, so the score stays at 0 until a real response is graded."]
      : [
          "You used the guided mock sequence instead of letting page order control the attempt.",
          "Every response now maps back to exact mark-scheme points for targeted practice.",
        ],
    improvements: answeredPartCount === 0
      ? ["Complete at least one answer card to unlock mark-scheme diagnostics."]
      : Array.from(new Set(weakSkills)).slice(0, 4).map((skill) => `Practise ${skill} with one mark-scheme point per line.`),
    topicScores,
    lossPatterns: answeredPartCount === 0
      ? []
      : topicScores
        .filter((topic) => topic.awarded < topic.max)
        .sort((a, b) => (b.max - b.awarded) - (a.max - a.awarded))
        .slice(0, 5)
        .map((topic) => ({
          topic: topic.topic,
          missed: topic.max - topic.awarded,
          max: topic.max,
          reason: `Most losses sit in ${topic.skill}; revise the subtopic, then retry a similar part under time.`,
        })),
    attemptOrderEfficiency: efficiency,
    attemptOrderSummary: summary,
    hintReliance,
    timingNotes: buildTimingNotes(options.questionTimeSeconds ?? {}),
  };
}

export function emptyGrade(provenance: "failed" | "pending" = "pending"): AttemptGrade {
  return createZeroGrade(provenance);
}

function numericMatch(response: string, candidates: string[], tolerance = 0) {
  const responseNumbers = extractNumbers(response);
  if (!responseNumbers.length) {
    return "";
  }

  for (const candidate of candidates) {
    const candidateNumbers = extractNumbers(normalize(candidate));
    for (const candidateNumber of candidateNumbers) {
      for (const responseNumber of responseNumbers) {
        const allowed = Math.max(tolerance, Math.abs(candidateNumber) * 0.005);
        if (Math.abs(responseNumber - candidateNumber) <= allowed) {
          return String(candidateNumber);
        }
      }
    }
  }

  return "";
}

function extractNumbers(value: string) {
  const standardForm = [...value.matchAll(/(-?\d+(?:\.\d+)?)\s*(?:x|×)\s*10\^?(-?\d+)/gi)].map((match) =>
    Number(match[1]) * 10 ** Number(match[2]),
  );
  const regular = [...value.matchAll(/-?\d+(?:\.\d+)?/g)].map((match) => Number(match[0]));
  return [...standardForm, ...regular].filter(Number.isFinite);
}

export function scoreByTopic(grade: AttemptGrade) {
  return grade.topicScores.length ? grade.topicScores : scoreByTopicFromAwards(grade.awards);
}

function scoreByTopicFromAwards(awards: AttemptGrade["awards"]): TopicScore[] {
  return allSubQuestions.map((subQuestion) => {
    const award = awards.find((item) => item.subQuestionId === subQuestion.id);
    return {
      topic: subQuestion.topic,
      skill: subQuestion.skill,
      score: award ? Math.round((award.awarded / award.max) * 100) : 0,
      awarded: award?.awarded ?? 0,
      max: award?.max ?? subQuestion.marks,
    };
  });
}

function calculateHintReliance(hintUsage: Record<string, number> = {}) {
  const totalHints = Object.values(hintUsage).reduce((sum, value) => sum + value, 0);
  return Math.min(100, Math.round((totalHints / Math.max(1, allSubQuestions.length)) * 100));
}

function calculateAttemptOrderEfficiency(attemptOrder: string[], batchHistory: AttemptBatch[]) {
  const firstBatch = batchHistory[0]?.questionIds ?? [];
  if (attemptOrder.length === 0 || firstBatch.length === 0) {
    return {
      efficiency: 0,
      summary: "Complete a guided mock to measure whether fast-starred questions were banked first.",
    };
  }

  const firstBatchSet = new Set(firstBatch);
  const firstNonBatchIndex = attemptOrder.findIndex((questionId) => !firstBatchSet.has(questionId));
  const firstSection = firstNonBatchIndex === -1 ? attemptOrder : attemptOrder.slice(0, firstNonBatchIndex);
  const bankedFirst = firstSection.filter((questionId) => firstBatchSet.has(questionId)).length;
  const efficiency = Math.round((bankedFirst / firstBatch.length) * 100);

  return {
    efficiency,
    summary: efficiency === 100
      ? "Excellent sequencing: the first starred batch was attempted before slower questions."
      : "The first starred batch leaked into later work; tighten `Next *` discipline next time.",
  };
}

function buildTimingNotes(questionTimeSeconds: Record<string, number>) {
  const entries = Object.entries(questionTimeSeconds).sort((a, b) => b[1] - a[1]);
  if (entries.length === 0) {
    return ["Timing will unlock after a full guided attempt."];
  }

  return entries.slice(0, 3).map(([questionId, seconds]) => {
    const question = demoPaper.questions.find((item) => item.id === questionId);
    return `${question ? `Q${question.number}` : questionId} used ${Math.max(1, Math.round(seconds / 60))} min; compare that with its available marks.`;
  });
}
