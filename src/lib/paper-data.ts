import type { Paper } from "@/lib/types";

const pageImages = Array.from(
  { length: 20 },
  (_, index) => `/papers/5054-w25-21/page-${String(index + 1).padStart(2, "0")}.png`,
);


export const demoPaper: Paper = {
  id: "5054-w25-21",
  code: "5054/21",
  component: "Paper 2 Theory",
  subject: "Cambridge O Level Physics",
  board: "Cambridge",
  qualification: "O Level",
  curriculumTrack: "International GCSE/O Level",
  syllabusCode: "5054",
  session: "October/November 2025",
  durationMinutes: 105,
  totalMarks: 80,
  sourceTotalMarks: {
    questionPaper: 80,
    markSchemeCover: 75,
  },
  assets: {
    questionPaperPdf: "E:/Downloads/5054_w25_qp_21.pdf",
    markSchemePdf: "E:/Downloads/5054_w25_ms_21.pdf",
    pageImages,
  },
  sourceDocuments: [
    {
      type: "question_paper",
      originalPath: "E:/Downloads/5054_w25_qp_21.pdf",
      storagePath: "papers/5054-w25-21/source/5054_w25_qp_21.pdf",
      extractionStatus: "seeded",
    },
    {
      type: "mark_scheme",
      originalPath: "E:/Downloads/5054_w25_ms_21.pdf",
      storagePath: "papers/5054-w25-21/source/5054_w25_ms_21.pdf",
      extractionStatus: "seeded",
    },
    {
      type: "structured_json",
      storagePath: "papers/5054-w25-21/extracted/paper-data.json",
      extractionStatus: "reviewed",
    },
  ],
  questions: [
    {
      id: "q1",
      number: 1,
      title: "Momentum, force and kinetic energy",
      pageStart: 2,
      pageEnd: 3,
      totalMarks: 8,
      strategyHint: "Fast if graph gradients and kinetic-energy algebra feel secure.",
      prompt: "A car starts from rest and its momentum-time graph is used to calculate force, momentum and mass.",
      subQuestions: [
        {
          id: "q1a",
          label: "1(a)",
          prompt: "Use Fig. 1.1 to determine the resultant force during the first 1.5 s.",
          marks: 3,
          topic: "Forces and motion",
          skill: "Graph gradient",
          answerType: "calculation",        },
        {
          id: "q1b",
          label: "1(b)",
          prompt: "Show the kinetic-energy relationship, then use p at 6.0 s to determine the car mass.",
          marks: 5,
          topic: "Energy and momentum",
          skill: "Algebraic proof",
          answerType: "calculation",        },
      ],
    },
    {
      id: "q2",
      number: 2,
      title: "Lifting boxes, work and efficiency",
      pageStart: 4,
      pageEnd: 5,
      totalMarks: 8,
      strategyHint: "A good early target if formula choice feels routine.",
      prompt: "An electric motor lifts boxes in a cage; calculate weight, useful work, supplied energy and efficiency.",
      subQuestions: [
        {
          id: "q2a",
          label: "2(a)",
          prompt: "Calculate the total weight of the boxes and useful work done lifting them 13 m.",
          marks: 3,
          topic: "Work and energy",
          skill: "Formula selection",
          answerType: "calculation",        },
        {
          id: "q2b",
          label: "2(b)",
          prompt: "Use voltage, current and time to find supplied energy, then calculate efficiency.",
          marks: 3,
          topic: "Electrical energy",
          skill: "Efficiency",
          answerType: "calculation",        },
        {
          id: "q2c",
          label: "2(c)",
          prompt: "State two reasons why not all transferred energy becomes useful work on the boxes.",
          marks: 2,
          topic: "Energy transfers",
          skill: "Explanation",
          answerType: "short",        },
      ],
    },
    {
      id: "q3",
      number: 3,
      title: "Thermal transfer and states of matter",
      pageStart: 6,
      pageEnd: 7,
      totalMarks: 8,
      strategyHint: "Best for concise particle explanations.",
      prompt: "Ice is placed in water; describe conduction, calculate cooling energy and compare water particles.",
      subQuestions: [
        {
          id: "q3a",
          label: "3(a)",
          prompt: "Describe how energy is transferred by conduction from water to ice.",
          marks: 2,
          topic: "Thermal physics",
          skill: "Particle explanation",
          answerType: "short",        },
        {
          id: "q3b",
          label: "3(b)",
          prompt: "Calculate energy lost by water and explain liquid water and plastic cup insulation.",
          marks: 6,
          topic: "Thermal physics",
          skill: "Calculation and explanation",
          answerType: "extended",        },
      ],
    },
  ],
};

demoPaper.questions.push(
  {
    id: "q4",
    number: 4,
    title: "Refraction and converging lenses",
    pageStart: 8,
    pageEnd: 9,
    totalMarks: 11,
    strategyHint: "Star early if ray diagrams and lens vocabulary are strengths.",
    prompt: "A ray enters a converging lens; explain refraction and construct the virtual image.",
    subQuestions: [
      {
        id: "q4a",
        label: "4(a)",
        prompt: "Explain why the ray refracts and changes direction as it enters glass.",
        marks: 2,
        topic: "Waves and optics",
        skill: "Concept explanation",
        answerType: "short",      },
      {
        id: "q4b",
        label: "4(b)",
        prompt: "Define principal focus and focal length for a converging lens.",
        marks: 3,
        topic: "Waves and optics",
        skill: "Definitions",
        answerType: "short",      },
      {
        id: "q4c",
        label: "4(c)",
        prompt: "Draw and describe the image formed by the lens.",
        marks: 6,
        topic: "Waves and optics",
        skill: "Ray diagram",
        answerType: "diagram",      },
    ],
  },
  {
    id: "q5",
    number: 5,
    title: "Evaporation, induction heating and convection",
    pageStart: 10,
    pageEnd: 11,
    totalMarks: 9,
    strategyHint: "A middle-round choice because it mixes familiar transfer ideas.",
    prompt: "Liquid evaporates and is heated by induction; explain cooling, expansion and convection.",
    subQuestions: [
      {
        id: "q5a",
        label: "5(a)",
        prompt: "Explain why evaporation causes the temperature of liquid X to decrease.",
        marks: 2,
        topic: "Thermal physics",
        skill: "Energy explanation",
        answerType: "short",      },
      {
        id: "q5b",
        label: "5(b)",
        prompt: "Explain induction heating, expansion of the liquid and convection.",
        marks: 7,
        topic: "Thermal physics and electromagnetism",
        skill: "Linked explanation",
        answerType: "extended",      },
    ],
  },
);

demoPaper.questions.push(
  {
    id: "q6",
    number: 6,
    title: "Ohm's law and resistance",
    pageStart: 12,
    pageEnd: 13,
    totalMarks: 10,
    strategyHint: "Star early if circuit ratios and resistance geometry feel comfortable.",
    prompt: "A circuit contains a battery, resistor P and a fixed resistor; calculate current, power and voltmeter reading.",
    subQuestions: [
      {
        id: "q6a",
        label: "6(a)",
        prompt: "State Ohm's law.",
        marks: 2,
        topic: "Electricity",
        skill: "Definition",
        answerType: "short",      },
      {
        id: "q6b",
        label: "6(b)",
        prompt: "Calculate ammeter reading and power transferred to resistor P.",
        marks: 4,
        topic: "Electricity",
        skill: "Series circuits",
        answerType: "calculation",      },
      {
        id: "q6c",
        label: "6(c)",
        prompt: "Find the resistance of reshaped P and the new voltmeter reading.",
        marks: 4,
        topic: "Electricity",
        skill: "Resistance geometry",
        answerType: "calculation",      },
    ],
  },
  {
    id: "q7",
    number: 7,
    title: "Electrostatics and induced charge",
    pageStart: 14,
    pageEnd: 15,
    totalMarks: 8,
    strategyHint: "Good for a later round if you can keep electrons and protons straight.",
    prompt: "A charged plastic rod is brought near a conducting ball; explain charging, induction and attraction.",
    subQuestions: [
      {
        id: "q7a",
        label: "7(a)",
        prompt: "Describe what happens as the plastic rod becomes negatively charged.",
        marks: 2,
        topic: "Electricity",
        skill: "Particle model",
        answerType: "short",      },
      {
        id: "q7b",
        label: "7(b)",
        prompt: "Explain charge movement in the conducting ball and why it is attracted.",
        marks: 6,
        topic: "Electricity",
        skill: "Electrostatic induction",
        answerType: "extended",      },
    ],
  },
);

demoPaper.questions.push(
  {
    id: "q8",
    number: 8,
    title: "Radioactivity and Rutherford scattering",
    pageStart: 16,
    pageEnd: 17,
    totalMarks: 10,
    strategyHint: "Star it when nuclear notation and alpha scattering are fresh.",
    prompt: "Radon-222 emits an alpha particle; explain isotope composition and Rutherford scattering evidence.",
    subQuestions: [
      {
        id: "q8a",
        label: "8(a)",
        prompt: "Describe how radon-222 differs from radon-224.",
        marks: 2,
        topic: "Atomic physics",
        skill: "Isotope comparison",
        answerType: "short",      },
      {
        id: "q8b",
        label: "8(b)",
        prompt: "Complete the alpha decay equation.",
        marks: 3,
        topic: "Atomic physics",
        skill: "Nuclear notation",
        answerType: "calculation",      },
      {
        id: "q8c",
        label: "8(c)",
        prompt: "Use detector readings to explain what Rutherford scattering shows about atoms.",
        marks: 4,
        topic: "Atomic physics",
        skill: "Evidence explanation",
        answerType: "extended",      },
    ],
  },
  {
    id: "q9",
    number: 9,
    title: "Newton's first law and orbital motion",
    pageStart: 18,
    pageEnd: 20,
    totalMarks: 8,
    strategyHint: "A good end-phase target if circular motion calculations take you longer.",
    prompt: "An isolated object moves through space; then Venus orbits the Sun and speed is calculated.",
    subQuestions: [
      {
        id: "q9a",
        label: "9(a)",
        prompt: "Describe two features of the motion when no external forces act.",
        marks: 2,
        topic: "Forces and motion",
        skill: "Law statement",
        answerType: "short",      },
      {
        id: "q9b",
        label: "9(b)",
        prompt: "Explain circular motion of Venus and calculate its orbital speed.",
        marks: 6,
        topic: "Space physics",
        skill: "Circular motion",
        answerType: "calculation",      },
    ],
  },
);

export const allSubQuestions = demoPaper.questions.flatMap((question) =>
  question.subQuestions.map((subQuestion) => ({
    ...subQuestion,
    questionId: question.id,
    questionNumber: question.number,
  })),
);

export function getQuestion(questionId: string) {
  return demoPaper.questions.find((question) => question.id === questionId);
}

export function getSubQuestion(subQuestionId: string) {
  return allSubQuestions.find((subQuestion) => subQuestion.id === subQuestionId);
}
