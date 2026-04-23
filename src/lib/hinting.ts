import { z } from "zod";
import { getSubQuestion } from "@/lib/paper-data";

export const hintRequestSchema = z.object({
  paperId: z.string().optional(),
  questionId: z.string().optional(),
  subQuestionId: z.string(),
  answerDraft: z.string().optional(),
});

export const hintResponseSchema = z.object({
  title: z.string(),
  paragraphs: z.array(z.string()).min(2).max(3),
  guardrail: z.string(),
  nextAction: z.string(),
});

export type HintResponse = z.infer<typeof hintResponseSchema>;

const genericParagraphs = [
  "First identify the physics relationship the examiner is testing. Then separate the information in the question into givens, target quantity, and the condition that makes the relationship valid.",
  "Write the answer as a small chain of marking points rather than one long sentence. For calculations, show the relationship before substitution; for explanations, move from cause to observable effect.",
  "Before moving on, check whether the mark is likely for a unit, a direction word, a comparison, or a condition. Those small finishing details are where many near-correct answers lose marks.",
];

export function buildFallbackHint(
  subQuestionId: string,
  approachCue?: string,
): HintResponse {
  const subQuestion = getSubQuestion(subQuestionId);

  return {
    title: subQuestion ? `${subQuestion.label} approach cue` : "Approach cue",
    paragraphs: [
      approachCue ?? genericParagraphs[0],
      `For ${subQuestion?.skill ?? "this skill"}, think like the examiner: each clear idea earns its own space. Keep the answer focused on method and reasoning before committing to a final line.`,
      genericParagraphs[2],
    ],
    guardrail: "This hint guides the method without giving the final answer.",
    nextAction: "Write a two-line plan in the answer card, then answer from that plan.",
  };
}

export const hintJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["title", "paragraphs", "guardrail", "nextAction"],
  properties: {
    title: { type: "string" },
    paragraphs: {
      type: "array",
      minItems: 2,
      maxItems: 3,
      items: { type: "string" },
    },
    guardrail: { type: "string" },
    nextAction: { type: "string" },
  },
};
