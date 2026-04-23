import type { AttemptGrade, StudentSubjectRegistration } from "@/lib/types";

export const demoRegistrations: StudentSubjectRegistration[] = [
  { subject: "Physics", board: "Cambridge", qualification: "O Level", syllabusCode: "5054", status: "active" },
  { subject: "Chemistry", board: "Cambridge", qualification: "O Level", syllabusCode: "5070", status: "coming-soon" },
  { subject: "Biology", board: "Cambridge", qualification: "O Level", syllabusCode: "5090", status: "coming-soon" },
  { subject: "Mathematics D", board: "Cambridge", qualification: "O Level", syllabusCode: "4024", status: "coming-soon" },
  { subject: "Accounting", board: "Cambridge", qualification: "O Level", syllabusCode: "7707", status: "coming-soon" },
];

export const supportedSubjects = [
  "Physics",
  "Chemistry",
  "Biology",
  "Maths D",
  "Maths B",
  "Pure Maths",
  "Accounting",
  "Business Studies",
  "Economics",
  "Commerce",
];

export const sampleGrade: AttemptGrade = {
  totalAwarded: 16,
  totalMarks: 80,
  provenance: "deterministic",
  answeredPartCount: 8,
  blankPartCount: 12,
  gradingConfidence: 82,
  awards: [],
  strengths: [
    "You used the guided mock sequence instead of letting page order control the attempt.",
    "Every saved record maps back to topic and subtopic practice priorities.",
  ],
  improvements: [
    "Practise Graph gradient with one mark-scheme point per line.",
    "Practise Formula selection with one mark-scheme point per line.",
    "Practise Explanation with one mark-scheme point per line.",
    "Practise Efficiency with one mark-scheme point per line.",
  ],
  topicScores: [
    { topic: "Energy transfers", skill: "Explanation", score: 0, awarded: 0, max: 2 },
    { topic: "Thermal physics", skill: "Calculation and explanation", score: 0, awarded: 0, max: 6 },
    { topic: "Waves and optics", skill: "Concept explanation", score: 0, awarded: 0, max: 2 },
    { topic: "Waves and optics", skill: "Definitions", score: 0, awarded: 0, max: 3 },
    { topic: "Waves and optics", skill: "Ray diagram", score: 0, awarded: 0, max: 6 },
    { topic: "Thermal physics", skill: "Energy explanation", score: 0, awarded: 0, max: 2 },
    { topic: "Thermal physics and electromagnetism", skill: "Linked explanation", score: 0, awarded: 0, max: 7 },
    { topic: "Electricity", skill: "Series circuits", score: 0, awarded: 0, max: 4 },
  ],
  lossPatterns: [
    {
      topic: "Thermal physics and electromagnetism",
      missed: 7,
      max: 7,
      reason: "Most losses sit in linked explanations; revise the subtopic, then retry a similar part under time.",
    },
    {
      topic: "Thermal physics",
      missed: 6,
      max: 6,
      reason: "Most losses sit in calculation and explanation; revise the subtopic, then retry a similar part under time.",
    },
    {
      topic: "Waves and optics",
      missed: 6,
      max: 6,
      reason: "Most losses sit in ray diagrams; revise the subtopic, then retry a similar part under time.",
    },
    {
      topic: "Electricity",
      missed: 6,
      max: 6,
      reason: "Most losses sit in electrostatic induction; revise the subtopic, then retry a similar part under time.",
    },
  ],
  attemptOrderEfficiency: 100,
  attemptOrderSummary: "Excellent sequencing: the first starred batch was attempted before slower questions.",
  hintReliance: 14,
  timingNotes: ["Timing will unlock after a full guided attempt."],
};

export const dashboardStats = {
  latestScore: sampleGrade.totalAwarded,
  latestTotal: sampleGrade.totalMarks,
  cohortRank: 74,
  hintReliance: sampleGrade.hintReliance,
  timeUsedMinutes: 91,
  targetTimeMinutes: 105,
  topicScores: sampleGrade.topicScores,
  trend: [
    { name: "Attempt 1", score: 42, order: 45 },
    { name: "Attempt 2", score: 51, order: 58 },
    { name: "Attempt 3", score: 58, order: 72 },
    { name: "Mock", score: Math.round((sampleGrade.totalAwarded / sampleGrade.totalMarks) * 100), order: sampleGrade.attemptOrderEfficiency },
  ],
  improvementPlan: [
    "Open with a full scan, then star only the top-level questions you genuinely want in the first batch.",
    "For thermal and electrostatic explanations, write cause, evidence, and final effect as separate mark lines.",
    "For diagrams, spend 40 seconds checking construction rules before drawing.",
  ],
};
