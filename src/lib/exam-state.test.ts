import { describe, expect, it } from "vitest";
import {
  beginAnswerRound,
  canBeginAnswerRound,
  completeQuestion,
  createDemoAttempt,
  goToNextPage,
  goToNextStar,
  startFinalPhase,
  startRestarRound,
  startScan,
  toggleStar,
  visitQuestion,
} from "@/lib/exam-state";
import { demoPaper } from "@/lib/paper-data";

function visitEveryScannableQuestion() {
  let attempt = startScan(createDemoAttempt());
  for (let index = 1; index < demoPaper.questions.length; index += 1) {
    attempt = goToNextPage(attempt);
  }
  return attempt;
}

describe("exam strategy state machine", () => {
  it("starts with cover mode and enters scan mode with answers locked", () => {
    const attempt = startScan(createDemoAttempt());
    expect(attempt.phase).toBe("scan");
    expect(attempt.starredQuestionIds).toEqual([]);
    expect(attempt.scanVisitedQuestionIds).toEqual(["q1"]);
  });

  it("requires every top-level question to be visited before starting the first batch", () => {
    let attempt = startScan(createDemoAttempt());
    attempt = toggleStar(attempt, "q2");

    expect(canBeginAnswerRound(attempt)).toBe(false);
    expect(beginAnswerRound(attempt).phase).toBe("scan");

    attempt = visitEveryScannableQuestion();
    attempt = toggleStar(attempt, "q2");

    expect(canBeginAnswerRound(attempt)).toBe(true);
    expect(beginAnswerRound(attempt).phase).toBe("answer");
  });

  it("stars toggle only top-level batch selection and do not create confidence ratings", () => {
    let attempt = visitEveryScannableQuestion();
    attempt = toggleStar(attempt, "q2");
    attempt = toggleStar(attempt, "q6");
    attempt = toggleStar(attempt, "q2");

    expect(attempt.starredQuestionIds).toEqual(["q6"]);
    expect(`confidence${"ByQuestion"}` in attempt).toBe(false);
  });

  it("records a star batch and resets answering to page 1", () => {
    let attempt = visitEveryScannableQuestion();
    attempt = toggleStar(attempt, "q2");
    attempt = toggleStar(attempt, "q6");
    attempt = beginAnswerRound(attempt);

    expect(attempt.phase).toBe("answer");
    expect(attempt.currentQuestionId).toBe("q1");
    expect(attempt.starRounds).toEqual([["q2", "q6"]]);
    expect(attempt.activeBatchQuestionIds).toEqual(["q2", "q6"]);
  });

  it("next-star navigation skips completed starred questions and follows paper order", () => {
    let attempt = visitEveryScannableQuestion();
    attempt = toggleStar(attempt, "q2");
    attempt = toggleStar(attempt, "q6");
    attempt = beginAnswerRound(attempt);

    expect(goToNextStar(attempt).currentQuestionId).toBe("q2");
    attempt = visitQuestion(attempt, "q2");
    attempt = completeQuestion(attempt, "q2");

    expect(goToNextStar(attempt).currentQuestionId).toBe("q6");
  });

  it("re-star loop only scans unanswered questions", () => {
    let attempt = visitEveryScannableQuestion();
    attempt = toggleStar(attempt, "q1");
    attempt = beginAnswerRound(attempt);
    attempt = completeQuestion(attempt, "q1");
    attempt = startRestarRound(attempt);

    expect(attempt.phase).toBe("scan");
    expect(attempt.currentQuestionId).toBe("q2");
    expect(attempt.scanVisitedQuestionIds).toEqual(["q2"]);
  });

  it("second answer round lands on the first unanswered page instead of a completed page", () => {
    let attempt = visitEveryScannableQuestion();
    attempt = toggleStar(attempt, "q1");
    attempt = beginAnswerRound(attempt);
    attempt = completeQuestion(attempt, "q1");
    attempt = startRestarRound(attempt);

    for (let index = 1; index < demoPaper.questions.length - 1; index += 1) {
      attempt = goToNextPage(attempt);
    }

    attempt = toggleStar(attempt, "q4");
    attempt = beginAnswerRound(attempt);

    expect(attempt.phase).toBe("answer");
    expect(attempt.currentQuestionId).toBe("q2");
    expect(attempt.completedQuestionIds).toContain("q1");
    expect(attempt.activeBatchQuestionIds).toEqual(["q4"]);
    expect(goToNextStar(attempt).currentQuestionId).toBe("q4");
  });

  it("final phase contains only remaining unanswered questions", () => {
    let attempt = visitEveryScannableQuestion();
    attempt = toggleStar(attempt, "q1");
    attempt = beginAnswerRound(attempt);
    attempt = completeQuestion(attempt, "q1");
    attempt = startFinalPhase(attempt);

    expect(attempt.phase).toBe("final");
    expect(attempt.activeBatchQuestionIds).not.toContain("q1");
    expect(attempt.activeBatchQuestionIds[0]).toBe("q2");
  });
});
