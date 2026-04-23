export type ExamPhase = "cover" | "scan" | "answer" | "restar" | "final" | "submitted";

export type ExamBoard = "Cambridge" | "Edexcel" | "Bangladesh National English Version";
export type Qualification = "O Level" | "A Level" | "National Curriculum";

export type StudentSubjectRegistration = {
  subject: string;
  board: ExamBoard;
  qualification: Qualification;
  syllabusCode: string;
  status: "active" | "coming-soon";
};

export type SourceDocument = {
  type: "question_paper" | "mark_scheme" | "structured_json" | "diagram_asset";
  originalPath?: string;
  storagePath: string;
  extractionStatus: "seeded" | "reviewed" | "needs-review";
};

export type MarkSchemeItem = {
  id: string;
  label: string;
  marks: number;
  markType?: "M" | "A" | "B" | "dep" | "FT" | "unit" | "explanation";
  maxMarks?: number;
  dependencies?: string[];
  numericTolerance?: number;
  requiredConcepts?: string[][];
  acceptableAlternatives?: string[];
  forbiddenContradictions?: string[];
  unitRequirement?: string[];
  evidenceHint?: string;
  studentFeedback?: string;
  acceptable: string[];
  avoidRevealHint: string;
};

export type SubQuestion = {
  id: string;
  label: string;
  prompt: string;
  marks: number;
  topic: string;
  subtopic?: string;
  skill: string;
  answerType: "calculation" | "short" | "diagram" | "extended";
};

export type Question = {
  id: string;
  number: number;
  title: string;
  pageStart: number;
  pageEnd: number;
  totalMarks: number;
  strategyHint: string;
  prompt: string;
  diagramSpecId?: string;
  subQuestions: SubQuestion[];
};

export type Paper = {
  id: string;
  code: string;
  component: string;
  subject: string;
  board: ExamBoard;
  qualification: Qualification;
  curriculumTrack: string;
  syllabusCode: string;
  session: string;
  durationMinutes: number;
  totalMarks: number;
  sourceTotalMarks: {
    questionPaper: number;
    markSchemeCover: number;
  };
  assets: {
    questionPaperPdf: string;
    markSchemePdf: string;
    pageImages: string[];
  };
  sourceDocuments: SourceDocument[];
  questions: Question[];
};

export type ResponseMap = Record<string, string>;

export type AttemptBatch = {
  id: string;
  label: string;
  questionIds: string[];
  startedAt: string;
  completedAt?: string;
  completedQuestionIds: string[];
};

export type AttemptState = {
  attemptId: string;
  paperId: string;
  phase: ExamPhase;
  currentQuestionId: string;
  starRounds: string[][];
  activeStarRoundIndex: number;
  activeBatchQuestionIds: string[];
  batchHistory: AttemptBatch[];
  completedQuestionIds: string[];
  starredQuestionIds: string[];
  scanVisitedQuestionIds: string[];
  attemptOrder: string[];
  responses: ResponseMap;
  hintUsage: Record<string, number>;
  questionTimeSeconds: Record<string, number>;
  questionStartedAt: string;
  phaseTimestamps: Partial<Record<ExamPhase, string>>;
  startedAt: string;
  submittedAt?: string;
  submittedGrade?: AttemptGrade;
};

export type AttemptRecord = {
  attemptId: string;
  paperId: string;
  paperCode: string;
  subject: string;
  status: ExamPhase;
  gradeProvenance?: GradeProvenance;
  startedAt: string;
  submittedAt?: string;
  score?: number;
  totalMarks: number;
  durationMinutes: number;
  attemptOrderEfficiency?: number;
};

export type GradeProvenance = "deterministic" | "ai_assisted" | "failed" | "pending";

export type GradeAward = {
  subQuestionId: string;
  awarded: number;
  max: number;
  awardedPoints: string[];
  missedPoints: string[];
  evidence: string[];
  responseStatus: "blank" | "partial" | "complete";
  confidence: number;
  feedback: string;
};

export type AttemptGrade = {
  totalAwarded: number;
  totalMarks: number;
  provenance: GradeProvenance;
  answeredPartCount: number;
  blankPartCount: number;
  gradingConfidence: number;
  awards: GradeAward[];
  strengths: string[];
  improvements: string[];
  topicScores: TopicScore[];
  lossPatterns: LossPattern[];
  attemptOrderEfficiency: number;
  attemptOrderSummary: string;
  hintReliance: number;
  timingNotes: string[];
};

export type TopicScore = {
  topic: string;
  skill: string;
  score: number;
  awarded: number;
  max: number;
};

export type LossPattern = {
  topic: string;
  missed: number;
  max: number;
  reason: string;
};
