import { describe, expect, it } from "vitest";
import { gradeResponses } from "@/lib/grading";
import { demoPaper } from "@/lib/paper-data";

describe("mark scheme grading", () => {
  it("stores the requested 80-mark paper total", () => {
    expect(demoPaper.totalMarks).toBe(80);
    expect(demoPaper.sourceTotalMarks.markSchemeCover).toBe(75);
  });

  it("awards marks for recognised marking points", () => {
    const grade = gradeResponses({
      q1a: "change in momentum 18000 and force = change in momentum / time, so 12000 N",
    });

    const q1a = grade.awards.find((award) => award.subQuestionId === "q1a");
    expect(q1a?.awarded).toBe(3);
    expect(grade.topicScores.length).toBeGreaterThan(0);
    expect(grade.lossPatterns.length).toBeGreaterThan(0);
    expect(grade.hintReliance).toBeGreaterThanOrEqual(0);
    expect(grade.attemptOrderEfficiency).toBeGreaterThanOrEqual(0);
    expect(q1a?.evidence.length).toBeGreaterThan(0);
    expect(grade.provenance).toBe("deterministic");
  });

  it("awards zero for blank responses", () => {
    const grade = gradeResponses({});

    expect(grade.totalAwarded).toBe(0);
    expect(grade.totalMarks).toBe(80);
    expect(grade.answeredPartCount).toBe(0);
    expect(grade.lossPatterns).toEqual([]);
    expect(grade.awards.every((award) => award.awarded === 0 && award.responseStatus === "blank")).toBe(true);
  });

  it("does not award generic one-word keyword matches", () => {
    const grade = gradeResponses({
      q1b: "energy",
    });

    const q1b = grade.awards.find((award) => award.subQuestionId === "q1b");
    expect(q1b?.awarded).toBe(0);
  });
});
