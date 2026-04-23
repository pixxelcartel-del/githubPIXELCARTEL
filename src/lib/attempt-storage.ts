import { createDemoAttempt } from "@/lib/exam-state";
import { demoPaper } from "@/lib/paper-data";
import type { AttemptRecord, AttemptState } from "@/lib/types";

const attemptRecordIndexKey = "l2l:attempt-records";

export function attemptStorageKey(attemptId: string) {
  return `attempt:${attemptId}`;
}

export function readStoredAttempt(attemptId: string): AttemptState | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(attemptStorageKey(attemptId));
  if (!raw) {
    return null;
  }

  try {
    return migrateStoredAttempt(JSON.parse(raw), attemptId);
  } catch {
    return null;
  }
}

export function writeStoredAttempt(attempt: AttemptState) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(attemptStorageKey(attempt.attemptId), JSON.stringify(attempt));
  window.localStorage.setItem("l2l:last-attempt-id", attempt.attemptId);
  if (attempt.phase === "submitted" || attempt.submittedAt) {
    upsertAttemptRecord(attemptToRecord(attempt));
  }
}

export function readLastAttemptId() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem("l2l:last-attempt-id");
}

export function readAttemptRecords(): AttemptRecord[] {
  if (typeof window === "undefined") {
    return [];
  }

  const raw = window.localStorage.getItem(attemptRecordIndexKey);
  if (!raw) {
    return [];
  }

  try {
    const records = JSON.parse(raw);
    return Array.isArray(records)
      ? records
        .filter(isAttemptRecord)
        .filter((record) => record.status === "submitted" || Boolean(record.submittedAt))
        .sort((a, b) => new Date(b.submittedAt ?? b.startedAt).getTime() - new Date(a.submittedAt ?? a.startedAt).getTime())
      : [];
  } catch {
    return [];
  }
}

export function writeAttemptRecords(records: AttemptRecord[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(attemptRecordIndexKey, JSON.stringify(records.slice(0, 25)));
}

export function upsertAttemptRecord(record: AttemptRecord) {
  const existing = readAttemptRecords().filter((item) => item.attemptId !== record.attemptId);
  writeAttemptRecords([record, ...existing]);
}

export function createResitAttempt(sourceAttempt?: AttemptState | null) {
  const id = createAttemptId(sourceAttempt?.paperId ?? demoPaper.id);
  return createDemoAttempt(id);
}

export function createAttemptId(paperId = demoPaper.id) {
  return `${paperId}-attempt-${Date.now().toString(36)}`;
}

export function migrateStoredAttempt(value: unknown, fallbackAttemptId = "demo-attempt"): AttemptState {
  const incoming = value && typeof value === "object" ? value as Partial<AttemptState> & Record<string, unknown> : {};
  const cleanIncoming = { ...incoming };
  delete cleanIncoming.confidenceByQuestion;
  delete cleanIncoming.questionVisitStartedAt;
  const base = createDemoAttempt(typeof incoming.attemptId === "string" ? incoming.attemptId : fallbackAttemptId);
  const questionStartedAt =
    typeof incoming.questionStartedAt === "string"
      ? incoming.questionStartedAt
      : typeof incoming.questionVisitStartedAt === "string"
        ? incoming.questionVisitStartedAt
        : base.questionStartedAt;

  return {
    ...base,
    ...cleanIncoming,
    activeBatchQuestionIds: arrayOfStrings(incoming.activeBatchQuestionIds),
    batchHistory: Array.isArray(incoming.batchHistory) ? incoming.batchHistory as AttemptState["batchHistory"] : [],
    completedQuestionIds: arrayOfStrings(incoming.completedQuestionIds),
    starredQuestionIds: arrayOfStrings(incoming.starredQuestionIds),
    scanVisitedQuestionIds: arrayOfStrings(incoming.scanVisitedQuestionIds),
    attemptOrder: arrayOfStrings(incoming.attemptOrder),
    responses: isRecord(incoming.responses) ? incoming.responses as AttemptState["responses"] : {},
    hintUsage: isRecord(incoming.hintUsage) ? incoming.hintUsage as AttemptState["hintUsage"] : {},
    questionTimeSeconds: isRecord(incoming.questionTimeSeconds) ? incoming.questionTimeSeconds as AttemptState["questionTimeSeconds"] : {},
    questionStartedAt,
    phaseTimestamps: isRecord(incoming.phaseTimestamps) ? incoming.phaseTimestamps as AttemptState["phaseTimestamps"] : base.phaseTimestamps,
    submittedGrade: migrateStoredGrade(incoming.submittedGrade),
  };
}

function migrateStoredGrade(value: unknown) {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  const grade = value as Record<string, unknown>;
  const awards = Array.isArray(grade.awards)
    ? grade.awards.map((award) => {
      const item = award as Record<string, unknown>;
      return {
        ...item,
        evidence: Array.isArray(item.evidence) ? item.evidence : [],
        responseStatus: typeof item.responseStatus === "string" ? item.responseStatus : "partial",
        confidence: typeof item.confidence === "number" ? item.confidence : 0.7,
      };
    })
    : [];

  return {
    ...grade,
    provenance: typeof grade.provenance === "string" ? grade.provenance : "deterministic",
    answeredPartCount: typeof grade.answeredPartCount === "number" ? grade.answeredPartCount : 0,
    blankPartCount: typeof grade.blankPartCount === "number" ? grade.blankPartCount : 0,
    gradingConfidence: typeof grade.gradingConfidence === "number" ? grade.gradingConfidence : 0,
    awards,
    attemptOrderEfficiency: typeof grade.attemptOrderEfficiency === "number" ? grade.attemptOrderEfficiency : 0,
    attemptOrderSummary: typeof grade.attemptOrderSummary === "string" ? grade.attemptOrderSummary : "Run a fresh guided mock to measure attempt-order efficiency.",
    hintReliance: typeof grade.hintReliance === "number"
      ? grade.hintReliance
      : typeof grade.hintDependency === "number"
        ? grade.hintDependency
        : 0,
    timingNotes: Array.isArray(grade.timingNotes) ? grade.timingNotes : [],
  } as AttemptState["submittedGrade"];
}

function attemptToRecord(attempt: AttemptState): AttemptRecord {
  return {
    attemptId: attempt.attemptId,
    paperId: attempt.paperId,
    paperCode: demoPaper.code,
    subject: demoPaper.subject,
    status: attempt.phase,
    gradeProvenance: attempt.submittedGrade?.provenance ?? (attempt.phase === "submitted" ? "pending" : undefined),
    startedAt: attempt.startedAt,
    submittedAt: attempt.submittedAt,
    score: attempt.submittedGrade?.totalAwarded,
    totalMarks: attempt.submittedGrade?.totalMarks ?? demoPaper.totalMarks,
    durationMinutes: Math.round(Object.values(attempt.questionTimeSeconds).reduce((sum, value) => sum + value, 0) / 60),
    attemptOrderEfficiency: attempt.submittedGrade?.attemptOrderEfficiency,
  };
}

function isAttemptRecord(value: unknown): value is AttemptRecord {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as Partial<AttemptRecord>;
  return typeof record.attemptId === "string" &&
    typeof record.paperId === "string" &&
    typeof record.paperCode === "string" &&
    typeof record.subject === "string" &&
    typeof record.startedAt === "string" &&
    typeof record.totalMarks === "number";
}

function arrayOfStrings(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function isRecord(value: unknown) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}
