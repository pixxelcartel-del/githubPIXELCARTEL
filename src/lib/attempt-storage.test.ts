import { describe, expect, it, beforeEach } from "vitest";
import { attemptStorageKey, createResitAttempt, migrateStoredAttempt, readAttemptRecords, readLastAttemptId, readStoredAttempt, writeStoredAttempt } from "@/lib/attempt-storage";
import { createDemoAttempt } from "@/lib/exam-state";

describe("attempt persistence", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("serializes attempts under the attempt id and remembers the latest attempt", () => {
    const attempt = {
      ...createDemoAttempt("demo-persist"),
      responses: { q1a: "force equals rate of change of momentum" },
    };

    writeStoredAttempt(attempt);

    expect(window.localStorage.getItem(attemptStorageKey("demo-persist"))).toContain("q1a");
    expect(readLastAttemptId()).toBe("demo-persist");
    expect(readStoredAttempt("demo-persist")?.responses.q1a).toContain("momentum");
    expect(readAttemptRecords()).toEqual([]);
  });

  it("only stores submitted attempts in saved test records", () => {
    const attempt = {
      ...createDemoAttempt("submitted-persist"),
      phase: "submitted" as const,
      submittedAt: "2026-04-22T00:00:00.000Z",
    };

    writeStoredAttempt(attempt);

    expect(readAttemptRecords()[0].attemptId).toBe("submitted-persist");
    expect(readAttemptRecords()[0].score).toBeUndefined();
    expect(readAttemptRecords()[0].gradeProvenance).toBe("pending");
  });

  it("returns null for corrupt saved attempts", () => {
    window.localStorage.setItem(attemptStorageKey("broken"), "{");

    expect(readStoredAttempt("broken")).toBeNull();
  });

  it("migrates legacy confidence attempts into the batch-based state shape", () => {
    const migrated = migrateStoredAttempt({
      attemptId: "legacy",
      questionVisitStartedAt: "2026-01-01T00:00:00.000Z",
      [`confidence${"ByQuestion"}`]: { q1: 5 },
      responses: { q1a: "momentum" },
    });

    expect(migrated.questionStartedAt).toBe("2026-01-01T00:00:00.000Z");
    expect(migrated.responses.q1a).toBe("momentum");
    expect(`confidence${"ByQuestion"}` in migrated).toBe(false);
  });

  it("creates resit attempts with fresh ids and empty responses", () => {
    const original = createDemoAttempt("original");
    const resit = createResitAttempt(original);

    expect(resit.attemptId).not.toBe(original.attemptId);
    expect(resit.responses).toEqual({});
    expect(resit.phase).toBe("cover");
  });
});
