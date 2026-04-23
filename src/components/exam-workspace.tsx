"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, CheckCircle2, FileClock, HelpCircle, RotateCcw, Send, Sparkles, Star } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { DiagramRenderer } from "@/components/diagram-renderer";
import { L2Logo } from "@/components/l2-logo";
import { ThemeToggle } from "@/components/theme-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GlassPanel, InkPanel, PaperPanel } from "@/components/ui/surface";
import {
  beginAnswerRound,
  canBeginAnswerRound,
  completeQuestion,
  createDemoAttempt,
  getScannableQuestionIds,
  goToNextPage,
  goToNextStar,
  goToPreviousPage,
  recordQuestionTime,
  startFinalPhase,
  startRestarRound,
  startScan,
  submitAttempt,
  toggleStar,
  visitQuestion,
} from "@/lib/exam-state";
import { buildFallbackHint, type HintResponse } from "@/lib/hinting";
import { demoPaper, getQuestion } from "@/lib/paper-data";
import { createResitAttempt, readStoredAttempt, writeStoredAttempt } from "@/lib/attempt-storage";
import { createZeroGrade } from "@/lib/grade-view";
import type { AttemptGrade, AttemptState, Question, SubQuestion } from "@/lib/types";
import { cn } from "@/lib/utils";

export function ExamWorkspace({ attemptId }: { attemptId: string }) {
  const router = useRouter();
  const [state, setState] = useState<AttemptState>(() => createDemoAttempt(attemptId));
  const [activeHint, setActiveHint] = useState<HintResponse | null>(null);
  const [hintLoadingFor, setHintLoadingFor] = useState<string | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("Loading saved attempt...");
  const [hydrated, setHydrated] = useState(false);
  const pendingStatusRef = useRef<string | null>(null);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (active) {
        setState(readStoredAttempt(attemptId) ?? createDemoAttempt(attemptId));
        setStatusMessage("Attempt autosave is ready.");
        setHydrated(true);
      }
    });
    return () => {
      active = false;
    };
  }, [attemptId]);

  useEffect(() => {
    if (hydrated) {
      writeStoredAttempt(state);
      if (pendingStatusRef.current) {
        setStatusMessage(pendingStatusRef.current);
        pendingStatusRef.current = null;
        return;
      }
      setStatusMessage(state.phase === "submitted" ? "Attempt record saved." : "Draft saved locally.");
    }
  }, [hydrated, state]);

  const currentQuestion = useMemo(
    () => getQuestion(state.currentQuestionId) ?? demoPaper.questions[0],
    [state.currentQuestionId],
  );

  const isScan = state.phase === "scan";
  const isAnswering = state.phase === "answer" || state.phase === "final";
  const isStarred = state.starredQuestionIds.includes(currentQuestion.id);
  const answeredSubparts = currentQuestion.subQuestions.filter((part) => state.responses[part.id]?.trim()).length;
  const activeStarCount = state.activeBatchQuestionIds.filter((id) => !state.completedQuestionIds.includes(id)).length;
  const scannableQuestionIds = getScannableQuestionIds(state);
  const scanCanFinish = canBeginAnswerRound(state);

  function mutate(updater: (current: AttemptState) => AttemptState) {
    setState((current) => updater(current));
  }

  async function requestHint(subQuestionId: string) {
    setHintLoadingFor(subQuestionId);
    try {
      const response = await fetch("/api/hint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subQuestionId,
          paperId: state.paperId,
          questionId: currentQuestion.id,
          answerDraft: state.responses[subQuestionId] ?? "",
        }),
      });
      const json = (await response.json()) as HintResponse;
      setActiveHint(json);
      setStatusMessage("Hint opened and hint use was saved.");
      mutate((value) => ({
        ...value,
        hintUsage: {
          ...value.hintUsage,
          [subQuestionId]: (value.hintUsage[subQuestionId] ?? 0) + 1,
        },
      }));
    } catch {
      setActiveHint(buildFallbackHint(subQuestionId));
      setStatusMessage("Fallback hint opened and hint use was saved.");
    } finally {
      setHintLoadingFor(null);
    }
  }

  function updateResponse(subQuestionId: string, value: string) {
    mutate((current) => ({
      ...current,
      responses: {
        ...current.responses,
        [subQuestionId]: value,
      },
    }));
  }

  function finishScan() {
    pendingStatusRef.current = "Returning to page 1 for your starred batch.";
    setStatusMessage("Returning to page 1 for your starred batch.");
    mutate(beginAnswerRound);
  }

  function handleScanStarToggle(questionId: string) {
    const wasStarred = state.starredQuestionIds.includes(questionId);
    mutate((value) => {
      const toggled = toggleStar(value, questionId);
      if (value.phase === "scan" && !wasStarred && value.currentQuestionId === questionId) {
        return goToNextPage(toggled);
      }
      return toggled;
    });
  }

  async function submitMock() {
    setSubmitLoading(true);
    setStatusMessage("Saving test record and building results coach...");
    const timed = recordQuestionTime(state);
    const submitted = submitAttempt(timed);
    let grade: AttemptGrade | undefined;
    try {
      const response = await fetch("/api/grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          responses: submitted.responses,
          hintUsage: submitted.hintUsage,
          attemptOrder: submitted.attemptOrder,
          batchHistory: submitted.batchHistory,
          questionTimeSeconds: submitted.questionTimeSeconds,
        }),
      });
      grade = response.ok ? (await response.json()) as AttemptGrade : createZeroGrade("failed");
    } catch {
      grade = createZeroGrade("failed");
    }
    const finalAttempt = { ...submitted, submittedGrade: grade };
    setState(finalAttempt);
    writeStoredAttempt(finalAttempt);
    setSubmitLoading(false);
    setStatusMessage("Test record saved. Opening results coach.");
    router.push(`/results/${attemptId}`);
  }

  function startResit() {
    const resit = createResitAttempt(state);
    writeStoredAttempt(resit);
    setStatusMessage("Fresh resit paper created.");
    router.push(`/exam/${resit.attemptId}`);
  }

  if (state.phase === "cover") {
    return (
      <ExamFrame statusMessage={statusMessage}>
        <section className="grid min-h-[calc(100vh-64px)] gap-5 p-4 lg:grid-cols-[0.88fr_1.12fr] lg:p-8">
          <div className="ui-glass l2l-rise-in flex flex-col justify-center rounded-lg p-6 sm:p-8">
            <Badge>Guided mock strategy</Badge>
            <h1 className="mt-5 max-w-2xl text-4xl font-black tracking-normal text-ink sm:text-6xl">
              Scan first. Star fast marks. Then answer like a strategist.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-soft">
              Read the whole preloaded paper before answering. Star only the top-level questions you want in the current fast/easy batch. L² then returns you to page one and unlocks `Next *` so you can bank that batch first.
            </p>
            <div className="mt-7 grid gap-3 text-sm text-soft sm:grid-cols-2">
              {["Answers stay locked during scan.", "Stars select the current attempt batch.", "`Next *` jumps only to unanswered starred questions.", "Hard/time-heavy questions wait for the final phase."].map((item) => (
                <div key={item} className="rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] p-3">
                  {item}
                </div>
              ))}
            </div>
            <Button className="mt-8 w-fit" size="lg" disabled={!hydrated} onClick={() => mutate(startScan)}>
              {hydrated ? "Begin scan" : "Preparing paper"} <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
          <DiaryPreview />
        </section>
      </ExamFrame>
    );
  }

  if (state.phase === "submitted") {
    return (
      <ExamFrame statusMessage={statusMessage}>
        <section className="grid min-h-[calc(100vh-64px)] place-items-center p-4">
          <div className="ui-glass max-w-2xl rounded-lg p-6 sm:p-8">
            <Badge>Saved test record</Badge>
            <FileClock className="mt-6 h-10 w-10 text-[var(--cyan)]" />
            <h1 className="mt-4 text-4xl font-black text-ink">This attempt is already submitted.</h1>
            <p className="mt-4 text-sm leading-6 text-soft">
              The record is saved locally for this browser. Open the results coach to review it, or resit the paper with a fresh blank attempt.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button onClick={() => router.push(`/results/${state.attemptId}`)}>Open results coach</Button>
              <Button variant="secondary" onClick={startResit}>Resit paper</Button>
            </div>
          </div>
        </section>
      </ExamFrame>
    );
  }

  return (
    <ExamFrame statusMessage={statusMessage}>
      <div className="p-4 lg:p-6">
        <div className="mx-auto grid max-w-[1360px] gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
          <StarNavigation
            state={state}
            currentQuestion={currentQuestion}
            onSelect={(id) => mutate((value) => visitQuestion(value, id))}
            onToggleStar={handleScanStarToggle}
          />

          <main className="min-w-0">
            <GlassPanel className="mb-4 flex flex-wrap items-center justify-between gap-3 p-3">
              <div>
                <p className="text-sm font-black text-ink">
                  {state.phase === "final" ? "Final hard phase" : state.phase === "restar" ? "Choose the next batch" : `Question ${currentQuestion.number}`}
                </p>
                <p className="text-xs text-muted">{currentQuestion.strategyHint}</p>
              </div>
              <div>
                <NavigationWidget
                  showNextStar={isAnswering && state.phase !== "final"}
                  nextStarDisabled={activeStarCount === 0}
                  onPrevious={() => mutate(goToPreviousPage)}
                  onNextPage={() => mutate(goToNextPage)}
                  onNextStar={() => mutate(goToNextStar)}
                />
              </div>
            </GlassPanel>

            <div
              key={`${state.phase}-${currentQuestion.id}`}
              className="page-flip l2l-page-in"
            >
              {state.phase === "restar" ? (
                <RestarPrompt
                  onRestar={() => mutate(startRestarRound)}
                  onFinal={() => mutate(startFinalPhase)}
                  onSubmit={submitMock}
                  submitLoading={submitLoading}
                  remaining={demoPaper.questions.length - state.completedQuestionIds.length}
                />
              ) : (
                <PaperDiary
                  question={currentQuestion}
                  isScan={isScan}
                  isAnswering={isAnswering}
                  isStarred={isStarred}
                  scanned={state.scanVisitedQuestionIds.length}
                  scannable={scannableQuestionIds.length}
                  starred={state.starredQuestionIds.length}
                  batchNumber={state.batchHistory.length + (state.phase === "scan" ? 1 : 0)}
                  onToggleStar={() => handleScanStarToggle(currentQuestion.id)}
                  navigation={
                    <NavigationWidget
                      showNextStar={isAnswering && state.phase !== "final"}
                      nextStarDisabled={activeStarCount === 0}
                      onPrevious={() => mutate(goToPreviousPage)}
                      onNextPage={() => mutate(goToNextPage)}
                      onNextStar={() => mutate(goToNextStar)}
                    />
                  }
                  answerPanel={
                    <AnswerPanel
                      question={currentQuestion}
                      state={state}
                      answeredSubparts={answeredSubparts}
                      disabled={!isAnswering}
                      hintLoadingFor={hintLoadingFor}
                      onHint={requestHint}
                      onChange={updateResponse}
                      canBeginAnswer={scanCanFinish}
                      scanVisited={state.scanVisitedQuestionIds.length}
                      scanTotal={scannableQuestionIds.length}
                      onBeginAnswer={finishScan}
                      onDone={() => mutate((value) => goToNextStar(completeQuestion(value, currentQuestion.id)))}
                      onSubmit={submitMock}
                      submitLoading={submitLoading}
                      statusMessage={statusMessage}
                    />
                  }
                />
              )}
            </div>
          </main>
        </div>
      </div>

      <HintModal hint={activeHint} onClose={() => setActiveHint(null)} />
    </ExamFrame>
  );
}

function ExamFrame({ children, statusMessage }: { children: React.ReactNode; statusMessage?: string }) {
  return (
    <div className="l2-bg min-h-screen">
      <header className="sticky top-0 z-30 flex min-h-16 items-center justify-between border-b border-[var(--border)] bg-[var(--surface-strong)]/78 px-4 backdrop-blur-xl">
        <Link href="/dashboard" className="flex items-center gap-2 text-sm font-black text-ink">
          <RotateCcw className="h-4 w-4" />
          <L2Logo markClassName="text-xl" /> <span className="text-[var(--cyan)]">Learn2 Learn</span>
        </Link>
        <div className="flex items-center gap-2">
          <Badge>{demoPaper.code} / {demoPaper.durationMinutes} min / {demoPaper.totalMarks} marks</Badge>
          <ThemeToggle compact />
        </div>
      </header>
      {statusMessage && (
        <div role="status" aria-live="polite" className="sr-only">
          {statusMessage}
        </div>
      )}
      {children}
    </div>
  );
}

function NavigationWidget({
  showNextStar,
  nextStarDisabled,
  onPrevious,
  onNextPage,
  onNextStar,
}: {
  showNextStar: boolean;
  nextStarDisabled: boolean;
  onPrevious: () => void;
  onNextPage: () => void;
  onNextStar: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="secondary" onClick={onPrevious} aria-label="Previous question">
        <ArrowLeft className="h-4 w-4" /> Previous question
      </Button>
      <Button variant="secondary" onClick={onNextPage} aria-label="Next question">
        Next question <ArrowRight className="h-4 w-4" />
      </Button>
      {showNextStar && (
        <Button variant="subtle" onClick={onNextStar} disabled={nextStarDisabled}>
          Next <Star className="h-4 w-4 fill-[#d6a347] text-[#d6a347]" />
        </Button>
      )}
    </div>
  );
}

function StarNavigation({
  state,
  currentQuestion,
  onSelect,
  onToggleStar,
}: {
  state: AttemptState;
  currentQuestion: Question;
  onSelect: (id: string) => void;
  onToggleStar: (id: string) => void;
}) {
  return (
    <InkPanel className="rounded-lg p-4 text-white lg:sticky lg:top-[76px] lg:max-h-[calc(100vh-96px)] lg:overflow-auto">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-normal text-white/45">Phase</p>
          <p className="font-bold capitalize">{state.phase}</p>
        </div>
        <Badge>{state.completedQuestionIds.length}/{demoPaper.questions.length} done</Badge>
      </div>
      <div className="mt-5 space-y-2">
        {demoPaper.questions.map((question) => {
          const active = question.id === currentQuestion.id;
          const completed = state.completedQuestionIds.includes(question.id);
          const starred = state.starredQuestionIds.includes(question.id);
          const lockedInScan = state.phase === "scan" && state.completedQuestionIds.includes(question.id);
          return (
            <div
              key={question.id}
              className={cn(
                "flex items-center gap-2 rounded-lg px-2 py-1 transition",
                active && "bg-white text-[#081018] shadow-[var(--glow-cyan)]",
                lockedInScan && "opacity-35",
              )}
            >
              {state.phase === "scan" ? (
                <button
                  type="button"
                  disabled={lockedInScan}
                  aria-label={`${starred ? "Unstar" : "Star"} Q${question.number}`}
                  aria-pressed={starred}
                  className={cn(
                    "grid h-8 w-8 shrink-0 place-items-center rounded-md border border-white/15 text-white/55 transition hover:border-[var(--gold)]/55 hover:bg-[var(--gold)]/10 hover:text-[var(--gold)] disabled:cursor-not-allowed",
                    starred && "border-[var(--gold)]/60 bg-[var(--gold)]/15 text-[var(--gold)]",
                    active && "border-[var(--gold)]/50",
                  )}
                  onClick={() => onToggleStar(question.id)}
                >
                  <Star className={cn("h-4 w-4", starred && "fill-[var(--gold)]")} />
                </button>
              ) : (
                <span className="grid h-8 w-8 shrink-0 place-items-center">
                  {starred && <Star className="h-4 w-4 fill-[var(--gold)] text-[var(--gold)]" />}
                </span>
              )}
              <button
                type="button"
                disabled={lockedInScan}
                className="flex min-w-0 flex-1 items-center justify-between rounded-md px-2 py-1.5 text-left text-sm transition hover:bg-white/10 disabled:cursor-not-allowed"
                onClick={() => onSelect(question.id)}
              >
                <span>
                  <span className="font-bold">Q{question.number}</span>
                  <span className={cn("ml-2 text-xs", active ? "text-[#4f5b66]" : "text-white/45")}>{question.totalMarks}m</span>
                </span>
                <span className="flex items-center gap-2">
                  {completed && <CheckCircle2 className="h-4 w-4 text-[var(--green)]" />}
                {state.scanVisitedQuestionIds.includes(question.id) && state.phase === "scan" && <span className="h-2 w-2 rounded-full bg-[var(--cyan)]" />}
                </span>
              </button>
            </div>
          );
        })}
      </div>
      <div className="mt-5 rounded-lg border border-[var(--cyan)]/30 bg-[var(--cyan)]/10 p-3 text-xs leading-5 text-white/75">
        `Next *` reads the active starred batch and skips anything already marked done.
      </div>
    </InkPanel>
  );
}

function PaperDiary({
  question,
  isScan,
  isAnswering,
  isStarred,
  scanned,
  scannable,
  starred,
  batchNumber,
  onToggleStar,
  navigation,
  answerPanel,
}: {
  question: Question;
  isScan: boolean;
  isAnswering: boolean;
  isStarred: boolean;
  scanned: number;
  scannable: number;
  starred: number;
  batchNumber: number;
  onToggleStar: () => void;
  navigation: ReactNode;
  answerPanel: ReactNode;
}) {
  return (
    <section className="diary-spread relative grid gap-0 xl:grid-cols-[minmax(0,1fr)_28px_minmax(0,1fr)]">
      <PaperPanel className="min-h-[720px] rounded-r-none p-5 shadow-[0_28px_68px_rgba(8,16,24,0.20)] sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-normal text-[#596373]">Cambridge O Level Physics / {demoPaper.code}</p>
            <div className="mt-3 flex items-start gap-3">
              {isScan ? (
                <button
                  type="button"
                  aria-label={isStarred ? "Unstar" : "Star"}
                  aria-pressed={isStarred}
                  onClick={onToggleStar}
                  className={cn(
                    "mt-1 grid h-10 w-10 shrink-0 place-items-center rounded-md border border-[#101318]/10 bg-white/50 text-[#667085] transition hover:border-[var(--gold)]/60 hover:bg-[#fff7df] hover:text-[var(--gold)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--gold)]",
                    isStarred && "border-[var(--gold)]/70 bg-[#fff3ce] text-[var(--gold)] shadow-[0_0_18px_rgba(214,163,71,0.24)]",
                  )}
                >
                  <Star className={cn("h-5 w-5", isStarred && "fill-[var(--gold)]")} />
                </button>
              ) : (
                <span className="mt-1 grid h-10 w-10 shrink-0 place-items-center">
                  {isStarred && <Star className="h-5 w-5 fill-[var(--gold)] text-[var(--gold)]" />}
                </span>
              )}
              <h1 className="text-3xl font-black text-[#101318]">Q{question.number}. {question.title}</h1>
            </div>
            <p className="mt-3 text-sm leading-6 text-[#28313c]">{question.prompt}</p>
          </div>
          <Badge>{question.totalMarks} marks</Badge>
        </div>
        <div className="mt-6">
          <DiagramRenderer questionId={question.id} />
        </div>
        <div className="mt-6 space-y-3">
          {question.subQuestions.map((part) => (
            <QuestionPart key={part.id} part={part} />
          ))}
        </div>
      </PaperPanel>

      <div className="hidden bg-[linear-gradient(90deg,rgba(8,16,24,0.18),rgba(255,255,255,0.22),rgba(8,16,24,0.20))] shadow-[inset_14px_0_28px_rgba(8,16,24,0.16),inset_-14px_0_28px_rgba(8,16,24,0.15)] xl:block" aria-hidden="true" />

      <PaperPanel className="relative min-h-[720px] overflow-hidden rounded-l-none p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-normal text-[#667085]">Answer layer</p>
            <h2 className="mt-2 text-2xl font-black text-[#101318]">
              {isScan ? "Locked during scan" : isAnswering ? "Floating answer cards" : "Strategy state"}
            </h2>
          </div>
        </div>

        {isScan ? (
          <div className="mt-8">
            <div className="ui-glass rounded-lg p-5">
              <p className="text-sm font-bold text-ink">Fast/easy batch selection</p>
              <p className="mt-2 text-sm leading-6 text-soft">
                Star this top-level question only if you want to attempt it in batch {Math.max(1, batchNumber)}. Stars are not a rating; they are your current attempt order.
              </p>
              <div className="mt-5 grid gap-2 sm:grid-cols-3">
                <ScanCounter label="Visited" value={`${scanned}/${scannable}`} />
                <ScanCounter label="Starred" value={`${starred}`} />
                <ScanCounter label="Batch" value={`${Math.max(1, batchNumber)}`} />
              </div>
            </div>
            <div className="mt-6 rounded-lg border border-[var(--gold)]/30 bg-[var(--gold)]/10 p-4 text-sm leading-6 text-[#5a4217]">
              Visit every remaining question before starting the batch. This prevents page order from quietly choosing your strategy.
            </div>
            <div className="mt-5">{answerPanel}</div>
          </div>
        ) : (
          <div className="mt-5 max-h-[540px] overflow-auto pr-1">{answerPanel}</div>
        )}

        <div className="absolute bottom-5 left-5 right-5 hidden xl:block">{navigation}</div>
      </PaperPanel>
    </section>
  );
}

function ScanCounter({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] p-3">
      <p className="text-xs font-bold uppercase text-muted">{label}</p>
      <p className="mt-1 text-2xl font-black text-ink">{value}</p>
    </div>
  );
}

function QuestionPart({ part }: { part: SubQuestion }) {
  return (
    <div className="rounded-lg border border-[#101318]/10 bg-white/35 p-4 transition hover:-translate-y-0.5 hover:shadow-[0_18px_32px_rgba(9,12,18,0.12)]">
      <div className="flex items-center justify-between gap-3">
        <p className="font-bold text-[#101318]">{part.label}</p>
        <span className="text-xs font-bold text-[#667085]">{part.topic} / {part.marks}m</span>
      </div>
      <p className="mt-2 text-sm leading-6 text-[#28313c]">{part.prompt}</p>
    </div>
  );
}

function AnswerPanel({
  question,
  state,
  answeredSubparts,
  disabled,
  hintLoadingFor,
  onHint,
  onChange,
  canBeginAnswer,
  scanVisited,
  scanTotal,
  onBeginAnswer,
  onDone,
  onSubmit,
  submitLoading,
  statusMessage,
}: {
  question: Question;
  state: AttemptState;
  answeredSubparts: number;
  disabled: boolean;
  hintLoadingFor: string | null;
  onHint: (subQuestionId: string) => void;
  onChange: (subQuestionId: string, value: string) => void;
  canBeginAnswer: boolean;
  scanVisited: number;
  scanTotal: number;
  onBeginAnswer: () => void;
  onDone: () => void;
  onSubmit: () => void;
  submitLoading: boolean;
  statusMessage?: string;
}) {
  return (
    <div className="space-y-3">
      <GlassPanel className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-ink">{question.title}</h2>
            <p className="mt-1 text-sm text-muted">{answeredSubparts}/{question.subQuestions.length} answer cards started</p>
          </div>
          <Badge>{question.totalMarks}m</Badge>
        </div>
        <div className="mt-4 grid gap-2">
          {statusMessage && (
            <div role="status" aria-live="polite" className="rounded-lg bg-[color-mix(in_srgb,var(--green)_12%,transparent)] p-3 text-xs font-semibold text-soft">
              {statusMessage}
            </div>
          )}
          {state.phase === "scan" && (
            <Button className="w-full" disabled={!canBeginAnswer} onClick={onBeginAnswer}>
              {canBeginAnswer ? "Finish scan and answer stars" : `Scan all pages first (${scanVisited}/${scanTotal})`}
            </Button>
          )}
          {!disabled && (
            <Button className="w-full" onClick={onDone}>
              Mark question done
            </Button>
          )}
          {!disabled && (
            <Button variant="secondary" className="w-full" disabled={submitLoading} onClick={onSubmit}>
              <Send className="h-4 w-4" /> {submitLoading ? "Building results coach..." : "Submit mock"}
            </Button>
          )}
        </div>
      </GlassPanel>

      {disabled ? (
        <div className="rounded-lg border border-dashed border-[#101318]/15 bg-white/28 p-4 text-sm leading-6 text-[#394554]">
          Answer cards stay locked while you scan. Use the star beside the question number, then finish the scan after every required page has been visited.
        </div>
      ) : question.subQuestions.map((part) => (
        <GlassPanel key={part.id} className="p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="font-bold text-ink">{part.label}</p>
            <Button size="sm" variant="secondary" disabled={hintLoadingFor === part.id} onClick={() => onHint(part.id)}>
              <HelpCircle className="h-4 w-4" /> Hint
            </Button>
          </div>
          <p className="mt-2 text-sm leading-6 text-soft">{part.prompt}</p>
          <textarea
            value={state.responses[part.id] ?? ""}
            disabled={disabled}
            onChange={(event) => onChange(part.id, event.target.value)}
            className="mt-4 min-h-32 w-full resize-y rounded-lg border border-[var(--border)] bg-[var(--surface-strong)] p-3 text-sm text-ink outline-none transition focus:border-[var(--cyan)] focus:shadow-[var(--glow-cyan)] disabled:bg-[var(--surface-soft)] disabled:text-muted"
            placeholder={disabled ? "Answers unlock after scan." : "Write your answer here..."}
          />
        </GlassPanel>
      ))}
    </div>
  );
}

function HintModal({ hint, onClose }: { hint: HintResponse | null; onClose: () => void }) {
  useEffect(() => {
    if (!hint) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [hint, onClose]);

  if (!hint) {
    return null;
  }

  return (
    <div
      className="l2l-modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-[#090c12]/55 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Hint"
        className="ui-glass l2l-modal-panel max-h-[86vh] w-full max-w-xl overflow-auto rounded-lg p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <Badge>Hint</Badge>
        <h2 className="mt-4 text-2xl font-black text-ink">{hint.title}</h2>
        <div className="mt-4 space-y-4 text-sm leading-6 text-soft">
          {hint.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
        <p className="mt-5 rounded-lg border border-[var(--green)]/25 bg-[var(--green)]/10 p-3 text-sm font-semibold text-soft">
          {hint.nextAction}
        </p>
        <p className="mt-3 text-xs text-muted">{hint.guardrail}</p>
        <Button className="mt-5" onClick={onClose}>Back to paper</Button>
      </div>
    </div>
  );
}

function RestarPrompt({
  remaining,
  onRestar,
  onFinal,
  onSubmit,
  submitLoading,
}: {
  remaining: number;
  onRestar: () => void;
  onFinal: () => void;
  onSubmit: () => void;
  submitLoading: boolean;
}) {
  return (
    <section className="ui-glass min-h-[760px] rounded-lg p-8">
      <Badge>Starred batch complete</Badge>
      <h1 className="mt-5 max-w-3xl text-5xl font-black text-ink">Good. Now choose the next easiest unanswered set.</h1>
      <p className="mt-5 max-w-2xl text-base leading-7 text-soft">
        You have {remaining} top-level questions left. Re-star only the questions you want in the next batch. If everything left feels slow or risky, move into the final hard-question phase.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Button size="lg" onClick={onRestar}>
          Scan and star next batch <Sparkles className="h-4 w-4" />
        </Button>
        <Button size="lg" variant="secondary" onClick={onFinal}>
          Final hard phase
        </Button>
        <Button size="lg" variant="secondary" disabled={submitLoading} onClick={onSubmit}>
          <Send className="h-4 w-4" /> {submitLoading ? "Building results coach..." : "Submit mock"}
        </Button>
      </div>
      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {["Done: completed starred batch", "Next: choose another batch", "End: remaining hard questions"].map((item) => (
          <div key={item} className="rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] p-5 text-sm font-semibold text-soft">
            {item}
          </div>
        ))}
      </div>
    </section>
  );
}

function DiaryPreview() {
  return (
    <InkPanel className="relative min-h-[620px] overflow-hidden p-5">
      <div className="relative grid h-full gap-4 md:grid-cols-2">
        <PaperPanel className="p-6">
          <p className="text-xs font-bold uppercase text-[#667085]">Scan mode</p>
          <h2 className="mt-3 text-3xl font-black">Preloaded paper layer</h2>
          <p className="mt-4 text-sm leading-6">Typed question content, editable diagrams, star batch markers, and no scanned paper surface.</p>
          <DiagramRenderer questionId="q1" />
        </PaperPanel>
        <PaperPanel className="p-6">
          <p className="text-xs font-bold uppercase text-[#667085]">Answer layer</p>
          <h2 className="mt-3 text-3xl font-black">Locked first</h2>
          <div className="ui-glass mt-6 rounded-lg p-5 text-sm leading-6 text-soft">
            The answer card floats over the page after scanning. During scan, it stays veiled so the student chooses an attempt batch honestly.
          </div>
          <div className="mt-6 space-y-2">
            {[1, 2, 3].map((question) => (
              <div key={question} className="flex items-center gap-3 rounded-lg border border-[#101318]/10 bg-white/35 p-3">
                <Star className={cn("h-5 w-5 text-[var(--gold)]", question !== 2 && "fill-[var(--gold)]")} />
                <span className="text-sm font-black text-[#101318]">Q{question} batch toggle</span>
              </div>
            ))}
          </div>
        </PaperPanel>
      </div>
    </InkPanel>
  );
}
