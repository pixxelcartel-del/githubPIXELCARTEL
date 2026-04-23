import { describe, expect, it } from "vitest";
import { buildFallbackHint, hintResponseSchema } from "@/lib/hinting";

describe("hint schema", () => {
  it("returns non-answer fallback hints with a strict shape", () => {
    const hint = buildFallbackHint("q1a");
    expect(() => hintResponseSchema.parse(hint)).not.toThrow();
    expect(hint.paragraphs).toHaveLength(3);
    expect(hint.paragraphs.join(" ")).not.toContain("12000");
    expect(hint.paragraphs.join(" ")).not.toContain("18000");
    expect(hint.guardrail).toMatch(/without giving the final answer/i);
  });
});
