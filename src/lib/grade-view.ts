import { allSubQuestions, demoPaper } from "@/lib/paper-data";
import type { AttemptGrade, GradeProvenance, TopicScore } from "@/lib/types";

export function createZeroGrade(provenance: Extract<GradeProvenance, "failed" | "pending"> = "pending"): AttemptGrade {
  const awards = allSubQuestions.map((subQuestion) => ({
    subQuestionId: subQuestion.id,
    awarded: 0,
    max: subQuestion.marks,
    awardedPoints: [],
    missedPoints: [],
    evidence: [],
    responseStatus: "blank" as const,
    confidence: provenance === "failed" ? 0 : 1,
    feedback: "No response evidence was submitted for this part.",
  }));

  return {
    totalAwarded: 0,
    totalMarks: demoPaper.totalMarks,
    provenance,
    answeredPartCount: 0,
    blankPartCount: allSubQuestions.length,
    gradingConfidence: provenance === "failed" ? 0 : 100,
    awards,
    strengths: ["No answer evidence was submitted, so the score stays at 0 until a real response is graded."],
    improvements: ["Complete at least one answer card to unlock mark-scheme diagnostics."],
    topicScores: scoreByTopicFromAwards(awards),
    lossPatterns: [],
    attemptOrderEfficiency: 0,
    attemptOrderSummary: "Complete a guided mock to measure whether fast-starred questions were banked first.",
    hintReliance: 0,
    timingNotes: ["Timing will unlock after a full guided attempt."],
  };
}

function scoreByTopicFromAwards(awards: AttemptGrade["awards"]): TopicScore[] {
  return allSubQuestions.map((subQuestion) => {
    const award = awards.find((item) => item.subQuestionId === subQuestion.id);
    return {
      topic: subQuestion.topic,
      skill: subQuestion.skill,
      score: award && award.max > 0 ? Math.round((award.awarded / award.max) * 100) : 0,
      awarded: award?.awarded ?? 0,
      max: award?.max ?? subQuestion.marks,
    };
  });
}
