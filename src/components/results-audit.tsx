"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type ElementType } from "react";
import { AlertCircle, Clock, Crosshair, FileClock, Lightbulb, RotateCcw, Trophy } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button, buttonClassName } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { GlassPanel, InkPanel, Surface } from "@/components/ui/surface";
import { createResitAttempt, readAttemptRecords, readStoredAttempt, writeStoredAttempt } from "@/lib/attempt-storage";
import { createZeroGrade } from "@/lib/grade-view";
import { allSubQuestions } from "@/lib/paper-data";
import type { AttemptGrade, AttemptRecord, AttemptState } from "@/lib/types";

export function ResultsAudit({ attemptId }: { attemptId: string }) {
  const router = useRouter();
  const [attempt, setAttempt] = useState<AttemptState | null>(null);
  const [records, setRecords] = useState<AttemptRecord[]>([]);
  const [statusMessage, setStatusMessage] = useState("Loading saved records...");

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (active) {
        setAttempt(readStoredAttempt(attemptId));
        setRecords(readAttemptRecords());
        setStatusMessage("Saved records loaded.");
      }
    });
    return () => {
      active = false;
    };
  }, [attemptId]);

  const resultState = !attempt
    ? "not_found"
    : attempt.submittedGrade
      ? "submitted_graded"
      : attempt.phase === "submitted" || attempt.submittedAt
        ? "submitted_ungraded"
        : "submitted_ungraded";
  const grade = useMemo<AttemptGrade>(() => {
    if (attempt?.submittedGrade) {
      return attempt.submittedGrade;
    }

    return createZeroGrade(resultState === "submitted_ungraded" ? "failed" : "pending");
  }, [attempt, resultState]);

  const percent = Math.round((grade.totalAwarded / grade.totalMarks) * 100);
  const totalTime = attempt
    ? Math.round(Object.values(attempt.questionTimeSeconds).reduce((sum, value) => sum + value, 0) / 60)
    : 0;
  const hintsUsed = attempt ? Object.values(attempt.hintUsage).reduce((sum, value) => sum + value, 0) : 0;

  function handleResit() {
    const resit = createResitAttempt(attempt);
    writeStoredAttempt(resit);
    setStatusMessage("Fresh resit paper created.");
    router.push(`/exam/${resit.attemptId}`);
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
        <div role="status" aria-live="polite" className="sr-only">{statusMessage}</div>
        <section className="grid gap-5 xl:grid-cols-[1fr_430px]">
          <InkPanel className="p-6">
            <Badge className="bg-white text-[#081018]">Attempt {attemptId}</Badge>
            <h1 className="mt-4 text-4xl font-black tracking-normal text-white sm:text-6xl">Results coach</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/68 sm:text-base">
              Awarded points, blank answers, attempt order, hints, and next practice are assembled from the structured mark scheme. No sample marks are used for saved records.
            </p>
            {resultState !== "submitted_graded" && (
              <div className="mt-5 rounded-lg border border-[var(--gold)]/35 bg-[var(--gold)]/10 p-4 text-sm font-bold text-white">
                {resultState === "not_found" ? "No stored attempt was found in this browser." : "This attempt has no completed grade yet, so the displayed score is 0/80 until grading succeeds."}
              </div>
            )}
            <div className="mt-6 flex flex-wrap gap-3">
              <Button onClick={handleResit}>
                <RotateCcw className="h-4 w-4" /> Resit paper
              </Button>
              <Link href="/dashboard" className={buttonClassName({ variant: "secondary" })}>Back to dashboard</Link>
            </div>
          </InkPanel>

          <GlassPanel className="p-5">
            <h2 className="text-xl font-black text-ink">Saved record</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <AuditMetric icon={Trophy} label="Score" value={`${grade.totalAwarded}/${grade.totalMarks}`} progress={percent} />
              <AuditMetric icon={FileClock} label="Answered parts" value={`${grade.answeredPartCount}/${grade.answeredPartCount + grade.blankPartCount}`} progress={(grade.answeredPartCount / Math.max(1, grade.answeredPartCount + grade.blankPartCount)) * 100} />
              <AuditMetric icon={Crosshair} label="Attempt order" value={`${grade.attemptOrderEfficiency}%`} progress={grade.attemptOrderEfficiency} />
              <AuditMetric icon={Lightbulb} label="Hints used" value={`${hintsUsed}`} progress={grade.hintReliance} />
              <AuditMetric icon={Clock} label="Time tracked" value={`${totalTime} min`} progress={Math.min(100, (totalTime / 105) * 100)} />
            </div>
          </GlassPanel>
        </section>

        <section className="mt-5 grid gap-5 lg:grid-cols-[1fr_0.82fr]">
          <Surface className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-black text-ink">Mark-by-mark audit</h2>
                <p className="mt-1 text-sm text-muted">
                  You answered {grade.answeredPartCount} question parts. Blank parts score zero and do not generate fake loss analytics.
                </p>
              </div>
              <Badge>{grade.totalAwarded}/{grade.totalMarks}</Badge>
            </div>
            <div className="mt-4 space-y-3">
              {grade.awards.map((award) => {
                const subQuestion = allSubQuestions.find((item) => item.id === award.subQuestionId);
                return (
                  <div key={award.subQuestionId} className="rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="font-black text-ink">{subQuestion?.label} / {subQuestion?.skill}</p>
                      <Badge>{award.awarded}/{award.max}</Badge>
                    </div>
                    <p className="mt-2 text-sm text-soft">{award.feedback}</p>
                    <div className="mt-3 grid gap-2 md:grid-cols-2">
                      <PointList title="Awarded evidence" items={award.evidence.length ? award.evidence : award.awardedPoints} tone="green" />
                      <PointList title="Missed" items={award.missedPoints} tone="rose" />
                    </div>
                  </div>
                );
              })}
            </div>
          </Surface>

          <div className="space-y-5">
            {grade.answeredPartCount > 0 ? (
              <LossPatternList grade={grade} />
            ) : (
              <GlassPanel className="p-5">
                <h2 className="text-lg font-black text-ink">No response evidence yet</h2>
                <p className="mt-3 rounded-lg bg-[var(--surface-soft)] p-4 text-sm leading-6 text-soft">
                  Loss patterns unlock after at least one answer card contains a response. A blank submission correctly remains 0/{grade.totalMarks}.
                </p>
              </GlassPanel>
            )}
            <AttemptTimeline attempt={attempt} grade={grade} />
            <SavedRecordList records={records} />
            <GlassPanel className="p-5">
              <h2 className="text-lg font-black text-ink">Next practice</h2>
              <div className="mt-4 space-y-3">
                {grade.improvements.length ? grade.improvements.map((item) => (
                  <p key={item} className="rounded-lg bg-[color-mix(in_srgb,var(--cyan)_12%,transparent)] p-3 text-sm font-semibold text-soft">{item}</p>
                )) : (
                  <p className="rounded-lg bg-[color-mix(in_srgb,var(--green)_12%,transparent)] p-3 text-sm font-semibold text-soft">
                    Run a full attempt to unlock personalised recommendations.
                  </p>
                )}
                <Button className="w-full" onClick={handleResit}>
                  <RotateCcw className="h-4 w-4" /> Resit paper
                </Button>
              </div>
            </GlassPanel>
            {resultState !== "submitted_graded" && (
              <div className="rounded-lg border border-[color-mix(in_srgb,var(--rose)_32%,transparent)] bg-[color-mix(in_srgb,var(--rose)_11%,transparent)] p-4 text-sm text-soft">
                <AlertCircle className="mb-2 h-4 w-4 text-[var(--rose)]" />
                {resultState === "not_found" ? "No stored attempt was found in this browser." : "Grading did not complete for this attempt. The saved score remains 0 until grading is rerun."}
              </div>
            )}
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function AuditMetric({ icon: Icon, label, value, progress }: { icon: ElementType; label: string; value: string; progress: number }) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-muted">{label}</p>
        <Icon className="h-4 w-4 text-[var(--cyan)]" />
      </div>
      <p className="mt-3 text-2xl font-black text-ink">{value}</p>
      <Progress value={progress} className="mt-3" />
    </div>
  );
}

function LossPatternList({ grade }: { grade: AttemptGrade }) {
  return (
    <GlassPanel className="p-5">
      <h2 className="text-lg font-black text-ink">Loss patterns</h2>
      <div className="mt-4 space-y-3">
        {grade.lossPatterns.map((item) => (
          <div key={item.topic} className="rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="font-black text-ink">{item.topic}</p>
              <Badge>{item.missed}m leaked</Badge>
            </div>
            <p className="mt-2 text-sm leading-6 text-soft">{item.reason}</p>
          </div>
        ))}
      </div>
    </GlassPanel>
  );
}

function AttemptTimeline({ attempt, grade }: { attempt: AttemptState | null; grade: AttemptGrade }) {
  return (
    <GlassPanel className="p-5">
      <h2 className="text-lg font-black text-ink">Attempt sequence</h2>
      <p className="mt-3 rounded-lg bg-[var(--surface-soft)] p-4 text-sm leading-6 text-soft">{grade.attemptOrderSummary}</p>
      <div className="mt-3 space-y-2">
        {attempt?.batchHistory.map((batch) => (
          <div key={batch.id} className="rounded-lg border border-[color-mix(in_srgb,var(--cyan)_24%,transparent)] bg-[color-mix(in_srgb,var(--cyan)_10%,transparent)] p-3 text-sm text-soft">
            <span className="font-bold text-ink">{batch.label}:</span> {batch.questionIds.map((id) => id.toUpperCase()).join(", ")}
          </div>
        ))}
        {grade.timingNotes.map((note) => (
          <p key={note} className="rounded-lg bg-[var(--surface-soft)] p-3 text-sm text-soft">{note}</p>
        ))}
      </div>
    </GlassPanel>
  );
}

function SavedRecordList({ records }: { records: AttemptRecord[] }) {
  return (
    <GlassPanel className="p-5">
      <div className="flex items-center gap-2">
        <FileClock className="h-5 w-5 text-[var(--cyan)]" />
        <h2 className="text-lg font-black text-ink">Saved test records</h2>
      </div>
      <div className="mt-4 space-y-3">
        {records.length ? records.slice(0, 5).map((record) => (
          <Link key={record.attemptId} href={`/results/${record.attemptId}`} className="block rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] p-4 text-sm transition hover:bg-[var(--surface-strong)]">
            <div className="flex items-center justify-between gap-3">
              <span className="font-bold text-ink">{record.paperCode}</span>
              <Badge>{record.score ?? 0}/{record.totalMarks}</Badge>
            </div>
            <p className="mt-1 text-xs text-muted">{record.status} / {new Date(record.submittedAt ?? record.startedAt).toLocaleString()}</p>
          </Link>
        )) : (
          <p className="rounded-lg bg-[var(--surface-soft)] p-4 text-sm text-muted">No saved test records yet.</p>
        )}
      </div>
    </GlassPanel>
  );
}

function PointList({ title, items, tone }: { title: string; items: string[]; tone: "green" | "rose" }) {
  return (
    <div className={tone === "green" ? "rounded-lg bg-[color-mix(in_srgb,var(--green)_12%,transparent)] p-3" : "rounded-lg bg-[color-mix(in_srgb,var(--rose)_12%,transparent)] p-3"}>
      <p className="text-xs font-black uppercase text-muted">{title}</p>
      {items.length ? (
        <ul className="mt-2 space-y-1 text-xs text-soft">
          {items.map((item) => <li key={item}>{item}</li>)}
        </ul>
      ) : (
        <p className="mt-2 text-xs text-muted">None yet.</p>
      )}
    </div>
  );
}
