import { demoPaper } from "@/lib/paper-data";
import type { AttemptBatch, AttemptState, ExamPhase } from "@/lib/types";

export function createDemoAttempt(attemptId = "demo-attempt"): AttemptState {
  const now = new Date().toISOString();
  return {
    attemptId,
    paperId: demoPaper.id,
    phase: "cover",
    currentQuestionId: demoPaper.questions[0].id,
    starRounds: [],
    activeStarRoundIndex: -1,
    activeBatchQuestionIds: [],
    batchHistory: [],
    completedQuestionIds: [],
    starredQuestionIds: [],
    scanVisitedQuestionIds: [],
    attemptOrder: [],
    responses: {},
    hintUsage: {},
    questionTimeSeconds: {},
    questionStartedAt: now,
    phaseTimestamps: { cover: now },
    startedAt: now,
  };
}

export function startScan(state: AttemptState): AttemptState {
  const timedState = recordQuestionTime(state);
  const now = new Date().toISOString();
  const firstQuestionId = firstScannableQuestionId(timedState) ?? demoPaper.questions[0].id;

  return {
    ...timedState,
    phase: "scan",
    currentQuestionId: firstQuestionId,
    activeBatchQuestionIds: [],
    starredQuestionIds: [],
    scanVisitedQuestionIds: [firstQuestionId],
    questionStartedAt: now,
    phaseTimestamps: { ...timedState.phaseTimestamps, scan: now },
  };
}

export function toggleStar(state: AttemptState, questionId: string): AttemptState {
  if (state.phase !== "scan" || state.completedQuestionIds.includes(questionId)) {
    return state;
  }

  const isStarred = state.starredQuestionIds.includes(questionId);
  return {
    ...state,
    starredQuestionIds: isStarred
      ? state.starredQuestionIds.filter((id) => id !== questionId)
      : sortQuestionIds([...state.starredQuestionIds, questionId]),
  };
}

export function canBeginAnswerRound(state: AttemptState) {
  const scanIds = getScannableQuestionIds(state);
  return (
    state.phase === "scan" &&
    state.starredQuestionIds.length > 0 &&
    scanIds.every((questionId) => state.scanVisitedQuestionIds.includes(questionId))
  );
}

export function beginAnswerRound(state: AttemptState): AttemptState {
  if (!canBeginAnswerRound(state)) {
    return state;
  }

  const timedState = recordQuestionTime(state);
  const roundStars = sortQuestionIds(
    timedState.starredQuestionIds.filter((questionId) => !timedState.completedQuestionIds.includes(questionId)),
  );
  const now = new Date().toISOString();

  if (roundStars.length === 0) {
    return startFinalPhase(timedState);
  }

  const batchNumber = timedState.batchHistory.length + 1;
  const landingQuestionId =
    batchNumber === 1
      ? demoPaper.questions[0].id
      : firstScannableQuestionId(timedState) ?? roundStars[0] ?? demoPaper.questions[0].id;
  const batch: AttemptBatch = {
    id: `batch-${batchNumber}`,
    label: batchNumber === 1 ? "Fast/easy batch" : `Re-star batch ${batchNumber}`,
    questionIds: roundStars,
    startedAt: now,
    completedQuestionIds: [],
  };

  return {
    ...timedState,
    phase: "answer",
    currentQuestionId: landingQuestionId,
    starRounds: [...timedState.starRounds, roundStars],
    activeStarRoundIndex: timedState.starRounds.length,
    activeBatchQuestionIds: roundStars,
    batchHistory: [...timedState.batchHistory, batch],
    starredQuestionIds: roundStars,
    questionStartedAt: now,
    phaseTimestamps: { ...timedState.phaseTimestamps, answer: now },
  };
}

export function completeQuestion(state: AttemptState, questionId: string): AttemptState {
  const completedQuestionIds = state.completedQuestionIds.includes(questionId)
    ? state.completedQuestionIds
    : [...state.completedQuestionIds, questionId];
  const attemptOrder = state.attemptOrder.includes(questionId) ? state.attemptOrder : [...state.attemptOrder, questionId];
  const activeStars = state.starredQuestionIds.filter((id) => !completedQuestionIds.includes(id));
  const activeBatchQuestionIds = state.activeBatchQuestionIds.filter((id) => !completedQuestionIds.includes(id));
  const batchHistory = updateActiveBatch(state.batchHistory, state.activeBatchQuestionIds, questionId, activeBatchQuestionIds.length === 0);
  const unanswered = getUnansweredQuestionIds(completedQuestionIds);

  let phase: ExamPhase = state.phase;
  if (unanswered.length === 0) {
    phase = "submitted";
  } else if (state.phase === "answer" && activeBatchQuestionIds.length === 0) {
    phase = "restar";
  } else if (state.phase === "final") {
    phase = "final";
  }

  return {
    ...state,
    phase,
    completedQuestionIds,
    attemptOrder,
    starredQuestionIds: activeStars,
    activeBatchQuestionIds,
    batchHistory,
  };
}

export function goToNextPage(state: AttemptState): AttemptState {
  const ids = navigationQuestionIds(state);
  const index = ids.indexOf(state.currentQuestionId);
  return visitQuestion(state, ids[(index + 1) % ids.length]);
}

export function goToPreviousPage(state: AttemptState): AttemptState {
  const ids = navigationQuestionIds(state);
  const index = ids.indexOf(state.currentQuestionId);
  return visitQuestion(state, ids[(index - 1 + ids.length) % ids.length]);
}

export function goToNextStar(state: AttemptState): AttemptState {
  const availableStars = sortQuestionIds(
    state.activeBatchQuestionIds.filter((questionId) => !state.completedQuestionIds.includes(questionId)),
  );
  if (availableStars.length === 0) {
    return state;
  }

  const currentPaperIndex = paperIndex(state.currentQuestionId);
  const afterCurrent = availableStars.find((questionId) => paperIndex(questionId) > currentPaperIndex);
  return visitQuestion(state, afterCurrent ?? availableStars[0]);
}

export function startRestarRound(state: AttemptState): AttemptState {
  const timedState = recordQuestionTime(state);
  const firstUnanswered = firstScannableQuestionId(timedState);
  const now = new Date().toISOString();
  return {
    ...timedState,
    phase: "scan",
    currentQuestionId: firstUnanswered ?? demoPaper.questions[0].id,
    activeBatchQuestionIds: [],
    starredQuestionIds: [],
    scanVisitedQuestionIds: firstUnanswered ? [firstUnanswered] : [],
    questionStartedAt: now,
    phaseTimestamps: { ...timedState.phaseTimestamps, scan: now },
  };
}

export function startFinalPhase(state: AttemptState): AttemptState {
  const timedState = recordQuestionTime(state);
  const remaining = getUnansweredQuestionIds(timedState.completedQuestionIds);
  const now = new Date().toISOString();
  return {
    ...timedState,
    phase: "final",
    currentQuestionId: remaining[0] ?? demoPaper.questions[0].id,
    activeBatchQuestionIds: remaining,
    starredQuestionIds: [],
    scanVisitedQuestionIds: [],
    questionStartedAt: now,
    phaseTimestamps: { ...timedState.phaseTimestamps, final: now },
  };
}

export function submitAttempt(state: AttemptState): AttemptState {
  const timedState = recordQuestionTime(state);
  const now = new Date().toISOString();
  return {
    ...timedState,
    phase: "submitted",
    submittedAt: now,
    phaseTimestamps: { ...timedState.phaseTimestamps, submitted: now },
  };
}

export function getUnansweredQuestionIds(completedQuestionIds: string[]) {
  return demoPaper.questions
    .map((question) => question.id)
    .filter((questionId) => !completedQuestionIds.includes(questionId));
}

export function getScannableQuestionIds(state: AttemptState) {
  return getUnansweredQuestionIds(state.completedQuestionIds);
}

export function hasAnsweredQuestion(state: AttemptState, questionId: string) {
  const question = demoPaper.questions.find((item) => item.id === questionId);
  if (!question) {
    return false;
  }

  return question.subQuestions.some((subQuestion) => state.responses[subQuestion.id]?.trim());
}

export function visitQuestion(state: AttemptState, questionId: string): AttemptState {
  if (state.currentQuestionId === questionId) {
    return markScanVisited(state, questionId);
  }

  const timedState = recordQuestionTime(state);
  return markScanVisited(
    {
      ...timedState,
      currentQuestionId: questionId,
      questionStartedAt: new Date().toISOString(),
    },
    questionId,
  );
}

export function recordQuestionTime(state: AttemptState, now = new Date()): AttemptState {
  const startedAt = new Date(state.questionStartedAt);
  const elapsed = Number.isFinite(startedAt.getTime())
    ? Math.max(0, Math.round((now.getTime() - startedAt.getTime()) / 1000))
    : 0;

  if (elapsed === 0) {
    return state;
  }

  return {
    ...state,
    questionTimeSeconds: {
      ...state.questionTimeSeconds,
      [state.currentQuestionId]: (state.questionTimeSeconds[state.currentQuestionId] ?? 0) + elapsed,
    },
    questionStartedAt: now.toISOString(),
  };
}

function markScanVisited(state: AttemptState, questionId: string): AttemptState {
  if (state.phase !== "scan" || state.completedQuestionIds.includes(questionId) || state.scanVisitedQuestionIds.includes(questionId)) {
    return state;
  }

  return {
    ...state,
    scanVisitedQuestionIds: sortQuestionIds([...state.scanVisitedQuestionIds, questionId]),
  };
}

function firstScannableQuestionId(state: AttemptState) {
  return getScannableQuestionIds(state)[0];
}

function navigationQuestionIds(state: AttemptState) {
  const ids = state.phase === "scan" ? getScannableQuestionIds(state) : demoPaper.questions.map((question) => question.id);
  return ids.length ? ids : demoPaper.questions.map((question) => question.id);
}

function updateActiveBatch(batchHistory: AttemptBatch[], activeBatchIds: string[], questionId: string, batchComplete: boolean) {
  if (activeBatchIds.length === 0) {
    return batchHistory;
  }

  const activeBatchSet = new Set(activeBatchIds);
  return batchHistory.map((batch, index) => {
    if (index !== batchHistory.length - 1 || !activeBatchSet.has(questionId)) {
      return batch;
    }

    const completedQuestionIds = batch.completedQuestionIds.includes(questionId)
      ? batch.completedQuestionIds
      : [...batch.completedQuestionIds, questionId];

    return {
      ...batch,
      completedQuestionIds,
      completedAt: batchComplete ? new Date().toISOString() : batch.completedAt,
    };
  });
}

function sortQuestionIds(questionIds: string[]) {
  return [...questionIds].sort((a, b) => paperIndex(a) - paperIndex(b));
}

function paperIndex(questionId: string) {
  return demoPaper.questions.findIndex((question) => question.id === questionId);
}
