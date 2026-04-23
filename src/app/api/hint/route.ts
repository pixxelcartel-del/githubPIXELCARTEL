import OpenAI from "openai";
import { NextResponse } from "next/server";
import { hintJsonSchema, buildFallbackHint, hintRequestSchema, hintResponseSchema } from "@/lib/hinting";
import { getSubQuestion } from "@/lib/paper-data";
import { getMarkSchemeGuardrails } from "@/lib/paper-mark-scheme.server";

export async function POST(request: Request) {
  const parsed = hintRequestSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const subQuestion = getSubQuestion(parsed.data.subQuestionId);
  if (!subQuestion) {
    return NextResponse.json({ error: "Unknown sub-question." }, { status: 404 });
  }
  const guardrails = getMarkSchemeGuardrails(subQuestion.id);
  const fallbackHint = () => buildFallbackHint(subQuestion.id, guardrails[0]);

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(fallbackHint());
  }

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL ?? "gpt-5.4-mini",
      messages: [
        {
          role: "system",
          content:
            "You are an O/A-Level exam coach. Return one concise hint with 2-3 short paragraphs. Teach approach, examiner thinking, and structure. Never reveal final answers, final numbers, final values, or direct mark-scheme wording.",
        },
        {
          role: "user",
          content: JSON.stringify({
            question: subQuestion.prompt,
            paperId: parsed.data.paperId,
            questionId: parsed.data.questionId,
            topic: subQuestion.topic,
            skill: subQuestion.skill,
            answerDraft: parsed.data.answerDraft ?? "",
            markSchemeGuardrails: guardrails,
          }),
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "exam_hint",
          strict: true,
          schema: hintJsonSchema,
        },
      },
    });

    const content = response.choices[0]?.message.content;
    if (!content) {
      return NextResponse.json(fallbackHint());
    }

    const json = hintResponseSchema.parse(JSON.parse(content));
    return NextResponse.json(json);
  } catch {
    return NextResponse.json(fallbackHint());
  }
}
