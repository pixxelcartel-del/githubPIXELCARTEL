"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, BookOpenCheck, Check, GraduationCap, LibraryBig, UserRoundCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GlassPanel, InkPanel } from "@/components/ui/surface";
import { firebaseUserToStudentUser, getFirebaseAuth, isFirebaseConfigured, onAuthStateChanged } from "@/lib/firebase/client";
import { readFirestoreStudentProfile, writeFirestoreStudentProfile } from "@/lib/firebase/firestore";
import {
  boardOptions,
  createDemoGoogleUser,
  defaultStudentProfile,
  qualificationOptions,
  readStudentUser,
  subjectOptions,
  writeStudentProfile,
  writeStudentUser,
  type StudentProfile,
  type StudentUser,
} from "@/lib/student-profile";
import type { ExamBoard, Qualification } from "@/lib/types";
import { cn } from "@/lib/utils";

export function OnboardingBoot() {
  const router = useRouter();
  const fallback = defaultStudentProfile();
  const [user, setUser] = useState<StudentUser | null>(null);
  const [board, setBoard] = useState<ExamBoard>(fallback.board);
  const [qualification, setQualification] = useState<Qualification>(fallback.qualification);
  const [subjects, setSubjects] = useState<string[]>(fallback.subjects);
  const [targetSession, setTargetSession] = useState(fallback.targetSession);
  const [weeklyMockTarget, setWeeklyMockTarget] = useState(fallback.weeklyMockTarget);
  const [status, setStatus] = useState("Collecting the minimum setup needed to tailor the app.");

  useEffect(() => {
    let active = true;
    let unsubscribe: (() => void) | undefined;

    queueMicrotask(() => {
      if (!active) {
        return;
      }

      const stored = readStudentUser();
      if (stored) {
        setUser(stored);
        return;
      }

      if (!isFirebaseConfigured()) {
        const demo = createDemoGoogleUser();
        writeStudentUser(demo);
        setUser(demo);
        return;
      }

      unsubscribe = onAuthStateChanged(getFirebaseAuth(), async (authUser) => {
        if (!active) {
          return;
        }

        if (!authUser?.email) {
          router.replace("/login");
          return;
        }

        const profileUser = firebaseUserToStudentUser(authUser);
        writeStudentUser(profileUser);
        setUser(profileUser);

        const remoteProfile = await readFirestoreStudentProfile(authUser.uid);
        if (remoteProfile) {
          writeStudentProfile(remoteProfile);
          router.replace("/dashboard");
        }
      });

    });

    return () => {
      active = false;
      unsubscribe?.();
    };
  }, [router]);

  const activeSyllabusPreview = useMemo(() => {
    if (board === "Cambridge" && qualification === "O Level" && subjects.includes("Physics")) {
      return "Physics 5054 active now. Other selected subjects queue until you seed their papers.";
    }

    return "Your selected route is saved now; papers appear as soon as the developer seeds QP/MS resources.";
  }, [board, qualification, subjects]);

  function toggleSubject(subject: string) {
    setSubjects((current) => {
      if (current.includes(subject)) {
        return current.length === 1 ? current : current.filter((item) => item !== subject);
      }

      return [...current, subject];
    });
  }

  function completeBoot() {
    if (!user) {
      setStatus("Still loading the Gmail profile. Try again in a moment.");
      return;
    }

    const primarySubject = subjects.includes("Physics") ? "Physics" : subjects[0];
    const profile: StudentProfile = {
      board,
      qualification,
      curriculumTrack: board === "Bangladesh National English Version" ? "National English Version" : "International",
      subjects,
      primarySubject,
      targetSession,
      weeklyMockTarget,
      bootCompletedAt: new Date().toISOString(),
    };
    writeStudentProfile(profile);
    if (user.provider === "google" && isFirebaseConfigured()) {
      writeFirestoreStudentProfile(user.id, profile).catch(() => {
        setStatus("Profile saved locally. Firestore write needs Firebase rules/env setup.");
      });
    }
    setStatus("Profile setup complete. Opening the tailored dashboard.");
    router.push("/dashboard");
  }

  return (
    <div className="mx-auto grid min-h-screen max-w-6xl gap-5 px-4 py-8 sm:px-6 lg:grid-cols-[360px_1fr] lg:px-8">
      <InkPanel className="relative overflow-hidden p-6">
        <Badge className="bg-white text-[#081018]">First-time boot</Badge>
        <h1 className="mt-5 text-4xl font-black text-white">Build the student route before the dashboard wakes up.</h1>
        <p className="mt-4 text-sm leading-6 text-white/65">
          This setup maps one Gmail identity to board, level, subjects, seeded paper access, saved attempts, and progress analytics.
        </p>
        <div className="mt-6 space-y-3">
          {[
            ["1", "Choose board and exam level"],
            ["2", "Register active subjects"],
            ["3", "Unlock the guided mock cockpit"],
          ].map(([number, copy]) => (
            <div key={number} className="flex gap-3 rounded-lg border border-white/10 bg-white/8 p-3">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-white text-sm font-black text-[#081018]">{number}</span>
              <p className="text-sm font-bold leading-6 text-white/72">{copy}</p>
            </div>
          ))}
        </div>
        <div className="mt-6 rounded-lg border border-[var(--cyan)]/30 bg-[var(--cyan)]/10 p-4">
          <p className="text-xs font-black uppercase text-white/45">Signed in as</p>
          <p className="mt-2 text-sm font-black text-white">{user?.email ?? "Loading Gmail session..."}</p>
        </div>
      </InkPanel>

      <div className="space-y-5">
        <GlassPanel className="p-5">
          <div className="flex items-start gap-3">
            <GraduationCap className="mt-1 h-5 w-5 text-[var(--cyan)]" />
            <div>
              <h2 className="text-2xl font-black text-ink">Board and level</h2>
              <p className="mt-1 text-sm text-muted">This controls which catalog, syllabi, QP/MS pairs, and topic maps become visible.</p>
            </div>
          </div>
          <OptionGrid label="Board" options={boardOptions} active={board} onSelect={(value) => setBoard(value as ExamBoard)} />
          <OptionGrid label="Level" options={qualificationOptions} active={qualification} onSelect={(value) => setQualification(value as Qualification)} />
        </GlassPanel>

        <GlassPanel className="p-5">
          <div className="flex items-start gap-3">
            <LibraryBig className="mt-1 h-5 w-5 text-[var(--green)]" />
            <div>
              <h2 className="text-2xl font-black text-ink">Registered subjects</h2>
              <p className="mt-1 text-sm text-muted">Physics 5054 is seeded for this MVP. Other subjects stay queued until their paper resources are added.</p>
            </div>
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {subjectOptions.map((subject) => {
              const active = subjects.includes(subject);
              const seeded = subject === "Physics";

              return (
                <button
                  key={subject}
                  type="button"
                  aria-pressed={active}
                  onClick={() => toggleSubject(subject)}
                  className={cn(
                    "rounded-lg border p-3 text-left transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-soft)]",
                    active ? "border-[var(--cyan)] bg-[color-mix(in_srgb,var(--cyan)_12%,transparent)]" : "border-[var(--border)] bg-[var(--surface-soft)]",
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-black text-ink">{subject}</p>
                    {active && <Check className="h-4 w-4 text-[var(--green)]" />}
                  </div>
                  <p className="mt-1 text-xs text-muted">{seeded ? "5054 seeded" : "Queue for future QP/MS feed"}</p>
                </button>
              );
            })}
          </div>
        </GlassPanel>

        <GlassPanel className="p-5">
          <div className="flex items-start gap-3">
            <BookOpenCheck className="mt-1 h-5 w-5 text-[var(--gold)]" />
            <div>
              <h2 className="text-2xl font-black text-ink">Practice rhythm</h2>
              <p className="mt-1 text-sm text-muted">Used for next-mock reminders and dashboard recommendations.</p>
            </div>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-bold text-soft">
              Target session
              <input
                value={targetSession}
                onChange={(event) => setTargetSession(event.target.value)}
                className="mt-2 h-11 w-full rounded-md border border-[var(--border)] bg-[var(--surface-strong)] px-3 text-sm text-ink outline-none focus:border-[var(--cyan)]"
              />
            </label>
            <label className="text-sm font-bold text-soft">
              Mock target per week
              <input
                type="number"
                min={1}
                max={7}
                value={weeklyMockTarget}
                onChange={(event) => setWeeklyMockTarget(Number(event.target.value))}
                className="mt-2 h-11 w-full rounded-md border border-[var(--border)] bg-[var(--surface-strong)] px-3 text-sm text-ink outline-none focus:border-[var(--cyan)]"
              />
            </label>
          </div>
          <div className="mt-5 rounded-lg border border-[var(--green)]/30 bg-[var(--green)]/10 p-4">
            <div className="flex items-start gap-3">
              <UserRoundCheck className="mt-0.5 h-5 w-5 text-[var(--green)]" />
              <p className="text-sm leading-6 text-soft">{activeSyllabusPreview}</p>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <p role="status" aria-live="polite" className="text-sm text-muted">{status}</p>
            <Button size="lg" disabled={!subjects.length || !user} onClick={completeBoot}>
              Finish setup <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </GlassPanel>
      </div>
    </div>
  );
}

function OptionGrid({ label, options, active, onSelect }: { label: string; options: string[]; active: string; onSelect: (value: string) => void }) {
  return (
    <div className="mt-5">
      <p className="mb-2 text-xs font-black uppercase text-muted">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onSelect(option)}
            className={cn(
              "rounded-md border px-3 py-2 text-sm font-black transition hover:-translate-y-0.5",
              active === option
                ? "border-[var(--cyan)] bg-[color-mix(in_srgb,var(--cyan)_12%,transparent)] text-ink shadow-[var(--glow-cyan)]"
                : "border-[var(--border)] bg-[var(--surface-soft)] text-muted",
            )}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}
