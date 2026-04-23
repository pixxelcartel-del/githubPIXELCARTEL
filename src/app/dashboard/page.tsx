"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type ElementType } from "react";
import { ArrowRight, BookOpenCheck, BrainCircuit, CheckCircle2, DatabaseZap, HelpCircle, LibraryBig, LockKeyhole, Play, RotateCcw, Sparkles, Star, Target, TimerReset, Trophy, UserRound } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button, buttonClassName } from "@/components/ui/button";
import { GlassPanel, InkPanel, MetricTile, Surface } from "@/components/ui/surface";
import { createResitAttempt, readAttemptRecords, readLastAttemptId, readStoredAttempt, writeStoredAttempt } from "@/lib/attempt-storage";
import { dashboardStats, demoRegistrations, sampleGrade, supportedSubjects } from "@/lib/dashboard-data";
import { createZeroGrade } from "@/lib/grade-view";
import { demoPaper } from "@/lib/paper-data";
import { readStudentProfile, readStudentUser, type StudentProfile, type StudentUser } from "@/lib/student-profile";
import type { AttemptGrade, AttemptRecord, AttemptState } from "@/lib/types";
import { cn } from "@/lib/utils";

const resourcePipeline = [
  { label: "Catalog", value: "Board / level / subject hierarchy", status: "ready" },
  { label: "Source PDFs", value: "QP/MS stored in Supabase Storage", status: "ready" },
  { label: "Structured paper", value: "Native questions, parts, diagrams", status: "ready" },
  { label: "Private mark scheme", value: "Server-only grading context", status: "locked" },
  { label: "RAG chunks", value: "Exact ID first, pgvector fallback", status: "planned" },
];

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<StudentUser | null>(null);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [attempt, setAttempt] = useState<AttemptState | null>(null);
  const [records, setRecords] = useState<AttemptRecord[]>([]);
  const [activeTutorialStep, setActiveTutorialStep] = useState(0);
  const [statusMessage, setStatusMessage] = useState("Loading student cockpit...");

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) {
        return;
      }

      const storedUser = readStudentUser();
      if (!storedUser) {
        router.replace("/login");
        return;
      }

      const storedProfile = readStudentProfile();
      if (!storedProfile) {
        router.replace("/onboarding");
        return;
      }

      const id = readLastAttemptId() ?? "demo-attempt";
      setUser(storedUser);
      setProfile(storedProfile);
      setAttempt(readStoredAttempt(id));
      setRecords(readAttemptRecords());
      setStatusMessage("Cockpit loaded from the signed-in student profile.");
    });
    return () => {
      active = false;
    };
  }, [router]);

  const hasRealGrade = Boolean(attempt?.submittedGrade);
  const demoPreview = !hasRealGrade && records.length === 0;
  const grade = useMemo<AttemptGrade>(() => {
    if (attempt?.submittedGrade) {
      return attempt.submittedGrade;
    }

    return demoPreview ? sampleGrade : createZeroGrade("pending");
  }, [attempt, demoPreview]);

  const latestPercent = Math.round((grade.totalAwarded / grade.totalMarks) * 100);
  const totalTime = attempt
    ? Math.round(Object.values(attempt.questionTimeSeconds).reduce((sum, value) => sum + value, 0) / 60)
    : dashboardStats.timeUsedMinutes;
  const activeSubjects = profile?.subjects ?? ["Physics"];
  const activeBoard = profile?.board ?? "Cambridge";
  const activeQualification = profile?.qualification ?? "O Level";
  const seededSubjectCount = activeSubjects.filter((subject) => subject === "Physics").length;

  function startFreshMock() {
    const freshAttempt = createResitAttempt(attempt);
    writeStoredAttempt(freshAttempt);
    setStatusMessage("Fresh guided mock created.");
    router.push(`/exam/${freshAttempt.attemptId}`);
  }

  if (!user || !profile) {
    return (
      <AppShell>
        <div className="grid min-h-screen place-items-center px-4">
          <GlassPanel className="max-w-lg p-6 text-center">
            <Badge>Secure student cockpit</Badge>
            <h1 className="mt-4 text-3xl font-black text-ink">Preparing your profile</h1>
            <p className="mt-2 text-sm leading-6 text-soft">If this takes more than a moment, sign in with Gmail and complete the one-time setup.</p>
            <Link className={cn(buttonClassName({ variant: "secondary" }), "mt-5")} href="/login">Open login</Link>
          </GlassPanel>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mx-auto flex max-w-[1180px] flex-col gap-5 px-4 py-8 sm:px-6 lg:px-0">
        <div role="status" aria-live="polite" className="sr-only">{statusMessage}</div>

        <header className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <InkPanel className="relative overflow-hidden p-5 sm:p-7">
            <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/45 to-transparent" />
            <Badge className="bg-white text-[#081018]">Signed-in guided practice</Badge>
            <h1 className="mt-5 max-w-3xl text-4xl font-black text-white sm:text-6xl">
              {profile.primarySubject} cockpit for {activeBoard} {activeQualification}.
            </h1>
            <p className="mt-5 max-w-3xl text-sm leading-6 text-white/68">
              L² is not a paper converter. It is a preloaded mock-practice coach: the developer seeds QP/MS resources, Supabase stores the catalog and private mark scheme, and this dashboard adapts to each student&apos;s Gmail profile and registered subjects.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <Badge className="border-[var(--cyan)]/30 bg-[var(--cyan)]/12 text-white">{user.email}</Badge>
              <Badge className="border-[var(--green)]/30 bg-[var(--green)]/12 text-white">{activeSubjects.length} registered subjects</Badge>
              <Badge className="border-[var(--gold)]/30 bg-[var(--gold)]/12 text-white">{profile.targetSession}</Badge>
            </div>
          </InkPanel>

          <GlassPanel className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase text-muted">Next recommended mock</p>
                <h2 className="mt-2 text-2xl font-black text-ink">{demoPaper.subject} {demoPaper.syllabusCode}</h2>
                <p className="mt-1 text-sm text-muted">{demoPaper.code} / {demoPaper.durationMinutes} min / {demoPaper.totalMarks} marks</p>
              </div>
              <Play className="h-5 w-5 text-[var(--cyan)]" />
            </div>
            <div className="mt-5 grid gap-2">
              <Button onClick={startFreshMock}>
                <Play className="h-4 w-4" /> Start guided mock
              </Button>
              <Link className={buttonClassName({ variant: "secondary" })} href="/papers/5054-w25-21">
                Practice Library
              </Link>
            </div>
          </GlassPanel>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricTile label="Profile route" value={`${activeBoard}`} note={`${activeQualification} / ${profile.curriculumTrack}`} icon={<UserRound className="h-5 w-5" />} />
          <MetricTile label="Seeded subjects" value={`${seededSubjectCount}/${activeSubjects.length}`} note="Physics is active now; selected subjects queue automatically." icon={<LibraryBig className="h-5 w-5" />} tone="green" />
          <MetricTile label={demoPreview ? "Analytics state" : "Latest score"} value={demoPreview ? "Waiting" : `${grade.totalAwarded}/${grade.totalMarks}`} note={demoPreview ? "Complete a mock to unlock real records." : `${latestPercent}% from saved work.`} icon={<Trophy className="h-5 w-5" />} tone="gold" />
          <MetricTile label="Mock rhythm" value={`${profile.weeklyMockTarget}/week`} note="Used by recommendations and review pacing." icon={<TimerReset className="h-5 w-5" />} tone="rose" />
        </section>

        <section className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
          <StarSystemTutorial activeStep={activeTutorialStep} onSelect={setActiveTutorialStep} />
          <ResourcePipeline />
        </section>

        <section className="grid gap-5 xl:grid-cols-[1fr_360px]">
          <MasteryCockpit grade={grade} demoPreview={demoPreview} />
          <NextPractice grade={grade} totalTime={totalTime} />
        </section>

        <section className="grid gap-5 lg:grid-cols-[1fr_1fr]">
          <RegisteredSubjects activeSubjects={activeSubjects} />
          <SavedRecords records={records} demoPreview={demoPreview} />
        </section>
      </div>
    </AppShell>
  );
}

function StarSystemTutorial({ activeStep, onSelect }: { activeStep: number; onSelect: (index: number) => void }) {
  const steps = [
    {
      title: "Scan the whole paper",
      copy: "Answers stay locked. Visit every top-level question before starting. You are learning the paper shape before spending time.",
      icon: BookOpenCheck,
    },
    {
      title: "Star the current fast batch",
      copy: "A star is not confidence scoring. It simply means: I want this top-level question in the next easy/fast attempt batch.",
      icon: Star,
    },
    {
      title: "Return to Q1, then use Next *",
      copy: "The app returns to page one. Next * jumps only through unanswered starred questions in paper order.",
      icon: ArrowRight,
    },
    {
      title: "Re-star, then final hard phase",
      copy: "When the batch is done, choose the next easiest unanswered set. Slow/time-heavy questions are left for the final phase.",
      icon: Target,
    },
  ];
  const active = steps[activeStep] ?? steps[0];
  const Icon = active.icon;

  return (
    <Surface className="overflow-hidden p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black text-ink">Star-system tutorial</h2>
          <p className="mt-1 text-sm text-muted">This is the exam strategy engine. Stars control attempt order, not marks and not confidence.</p>
        </div>
        <Sparkles className="h-5 w-5 text-[var(--gold)]" />
      </div>
      <div className="mt-5 grid gap-4 lg:grid-cols-[220px_1fr]">
        <div className="space-y-2">
          {steps.map((step, index) => (
            <button
              key={step.title}
              type="button"
              onClick={() => onSelect(index)}
              className={cn(
                "w-full rounded-lg border p-3 text-left transition hover:-translate-y-0.5",
                activeStep === index ? "border-[var(--cyan)] bg-[color-mix(in_srgb,var(--cyan)_12%,transparent)] shadow-[var(--glow-cyan)]" : "border-[var(--border)] bg-[var(--surface-soft)]",
              )}
            >
              <p className="text-xs font-black uppercase text-muted">Step {index + 1}</p>
              <p className="mt-1 text-sm font-black text-ink">{step.title}</p>
            </button>
          ))}
        </div>
        <div className="relative min-h-[280px] overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] p-5">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--cyan)] to-transparent" />
          <div className="l2l-rise-in">
            <Icon className="h-9 w-9 text-[var(--cyan)]" />
            <h3 className="mt-5 text-3xl font-black text-ink">{active.title}</h3>
            <p className="mt-3 max-w-xl text-sm leading-7 text-soft">{active.copy}</p>
            <div className="mt-6 grid gap-2 sm:grid-cols-4">
              {steps.map((step, index) => (
                <div key={step.title} className={cn("h-2 rounded-full bg-[color-mix(in_srgb,var(--ink)_9%,transparent)]", index <= activeStep && "bg-[var(--cyan)] shadow-[var(--glow-cyan)]")} />
              ))}
            </div>
            <div className="mt-6 rounded-lg border border-[var(--gold)]/30 bg-[var(--gold)]/10 p-3 text-sm font-semibold text-soft">
              The simple star toggle sits beside each top-level question in the paper diary.
            </div>
          </div>
        </div>
      </div>
    </Surface>
  );
}

function ResourcePipeline() {
  return (
    <GlassPanel className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black text-ink">Supabase resource pipeline</h2>
          <p className="mt-1 text-sm text-muted">Built so adding QP/MS resources updates catalog-driven UI without redesigning screens.</p>
        </div>
        <DatabaseZap className="h-5 w-5 text-[var(--green)]" />
      </div>
      <div className="mt-5 space-y-3">
        {resourcePipeline.map((item) => (
          <div key={item.label} className="rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] p-3">
            <div className="flex items-center justify-between gap-3">
              <p className="font-black text-ink">{item.label}</p>
              <Badge>{item.status}</Badge>
            </div>
            <p className="mt-1 text-sm text-muted">{item.value}</p>
          </div>
        ))}
      </div>
      <div className="mt-5 rounded-lg border border-[var(--cyan)]/25 bg-[var(--cyan)]/10 p-3 text-sm leading-6 text-soft">
        Frontend reads public catalog/question layers. Hints, grading, audits, and MS-bearing RAG stay server-only.
      </div>
    </GlassPanel>
  );
}

function MasteryCockpit({ grade, demoPreview }: { grade: AttemptGrade; demoPreview: boolean }) {
  const rows = (grade.topicScores.length ? grade.topicScores : sampleGrade.topicScores).slice(0, 8);

  return (
    <Surface className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black text-ink">Topic and subtopic mastery</h2>
          <p className="mt-1 text-sm text-muted">{demoPreview ? "Preview only. Real mastery unlocks after a saved mock." : "Built from actual submitted responses and mark-scheme evidence."}</p>
        </div>
        <BrainCircuit className="h-5 w-5 text-[var(--cyan)]" />
      </div>
      <div className="mt-5 grid gap-3">
        {rows.map((item, index) => {
          const score = Math.max(0, Math.min(100, item.score));
          const tone = score < 45 ? "var(--rose)" : score < 75 ? "var(--gold)" : "var(--green)";

          return (
            <div key={`${item.topic}-${item.skill}-${index}`} className="motion-card rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] p-3">
              <div className="grid gap-3 sm:grid-cols-[1fr_150px] sm:items-center">
                <div>
                  <p className="text-sm font-black text-ink">{item.topic}</p>
                  <p className="mt-1 text-xs text-muted">{item.skill}</p>
                </div>
                <div className="text-left sm:text-right">
                  <p className="font-mono text-sm font-black text-ink">{item.awarded}/{item.max} marks</p>
                  <p className="text-xs text-muted">{score}% mastery evidence</p>
                </div>
              </div>
              <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-[color-mix(in_srgb,var(--ink)_9%,transparent)]" aria-label={`${item.topic} ${item.skill}: ${item.awarded} of ${item.max} marks`}>
                <div className="h-full rounded-full transition-all" style={{ width: `${Math.max(4, score)}%`, backgroundColor: tone }} />
              </div>
            </div>
          );
        })}
      </div>
    </Surface>
  );
}

function NextPractice({ grade, totalTime }: { grade: AttemptGrade; totalTime: number }) {
  const items = (grade.improvements.length ? grade.improvements : dashboardStats.improvementPlan).slice(0, 3);
  const panels = [
    { icon: TimerReset, title: "Timing discipline", text: `${totalTime || 0} min tracked. Keep a review buffer instead of spending it early.` },
    { icon: HelpCircle, title: "Hint reliance", text: `${grade.hintReliance}% of parts used hints. Resit target is under 20%.` },
    { icon: RotateCcw, title: "Attempt order", text: grade.attemptOrderSummary },
  ];

  return (
    <GlassPanel className="p-5">
      <h2 className="text-2xl font-black text-ink">Next practice plan</h2>
      <div className="mt-4 space-y-3">
        {panels.map((panel) => (
          <MiniCoach key={panel.title} icon={panel.icon} title={panel.title} text={panel.text} />
        ))}
      </div>
      <div className="mt-5 space-y-3">
        {items.map((item, index) => (
          <div key={item} className="flex gap-3 rounded-lg bg-[var(--surface-soft)] p-3">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-[var(--ink)] text-sm font-black text-[var(--background)]">{index + 1}</span>
            <p className="text-sm leading-6 text-soft">{item}</p>
          </div>
        ))}
      </div>
    </GlassPanel>
  );
}

function MiniCoach({ icon: Icon, title, text }: { icon: ElementType; title: string; text: string }) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] p-3">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-[var(--cyan)]" />
        <p className="text-sm font-black text-ink">{title}</p>
      </div>
      <p className="mt-2 text-xs leading-5 text-muted">{text}</p>
    </div>
  );
}

function RegisteredSubjects({ activeSubjects }: { activeSubjects: string[] }) {
  return (
    <GlassPanel className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black text-ink">Registered subjects</h2>
          <p className="mt-1 text-sm text-muted">Selected during boot. Cards activate as seeded papers are added to Supabase.</p>
        </div>
        <LibraryBig className="h-5 w-5 text-[var(--cyan)]" />
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {supportedSubjects.map((subject) => {
          const selected = activeSubjects.includes(subject);
          const registration = demoRegistrations.find((item) => item.subject === subject || item.subject === subject.replace("Maths", "Mathematics"));
          const active = selected && subject === "Physics";
          return (
            <div key={subject} className={cn("rounded-lg border p-3 transition", selected ? "border-[var(--cyan)] bg-[color-mix(in_srgb,var(--cyan)_8%,transparent)]" : "border-[var(--border)] bg-[var(--surface-soft)] opacity-70")}>
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-bold text-ink">{subject}</p>
                <Badge>{active ? "Active" : selected ? "Queued" : "Not registered"}</Badge>
              </div>
              <p className="mt-1 text-xs text-muted">{active ? registration?.syllabusCode ?? "5054" : selected ? "Awaiting seeded papers" : "Add from profile setup"}</p>
            </div>
          );
        })}
      </div>
    </GlassPanel>
  );
}

function SavedRecords({ records, demoPreview }: { records: AttemptRecord[]; demoPreview: boolean }) {
  return (
    <GlassPanel className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black text-ink">Saved test records</h2>
          <p className="mt-1 text-sm text-muted">Stored per student profile. No fake sample marks are saved as real records.</p>
        </div>
        <LockKeyhole className="h-5 w-5 text-[var(--gold)]" />
      </div>
      <div className="mt-4 space-y-3">
        {records.length ? records.slice(0, 4).map((record) => (
          <Link key={record.attemptId} href={`/results/${record.attemptId}`} className="block rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] p-3 text-sm transition hover:-translate-y-0.5 hover:bg-[var(--surface-strong)]">
            <div className="flex items-center justify-between gap-3">
              <span className="font-bold text-ink">{record.paperCode}</span>
              <Badge>{record.score ?? 0}/{record.totalMarks}</Badge>
            </div>
            <p className="mt-1 text-xs text-muted">{record.status} / {new Date(record.submittedAt ?? record.startedAt).toLocaleString()}</p>
          </Link>
        )) : (
          <div className="rounded-lg border border-dashed border-[var(--border)] bg-[var(--surface-soft)] p-4">
            <CheckCircle2 className="h-5 w-5 text-[var(--green)]" />
            <p className="mt-3 text-sm font-black text-ink">{demoPreview ? "Complete a mock to create the first real record." : "No saved records yet."}</p>
            <p className="mt-1 text-xs leading-5 text-muted">The dashboard will switch from preview analytics to student-specific results as soon as a mock is submitted.</p>
          </div>
        )}
      </div>
    </GlassPanel>
  );
}
