"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, CheckCircle2, Mail, ShieldCheck } from "lucide-react";
import { L2Logo } from "@/components/l2-logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GlassPanel, InkPanel } from "@/components/ui/surface";
import { firebaseUserToStudentUser, isFirebaseConfigured, signInWithGoogle } from "@/lib/firebase/client";
import { createDemoGoogleUser, readStudentProfile, writeStudentUser } from "@/lib/student-profile";

export function LoginPanel() {
  const router = useRouter();
  const [demoEmail, setDemoEmail] = useState("student@gmail.com");
  const [status, setStatus] = useState("Firebase Google login binds records, subject setup, cookies, and saved attempts to one student profile.");
  const firebaseReady = isFirebaseConfigured();

  async function handleGoogleSignIn() {
    if (!firebaseReady) {
      setStatus("Firebase keys are not loaded locally. Use demo Gmail to test the exact boot flow now.");
      return;
    }

    try {
      const credential = await signInWithGoogle();
      const token = await credential.user.getIdToken();
      const session = await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken: token }),
      });

      if (session.ok) {
        await credential.user.getIdToken(true);
      }

      writeStudentUser(firebaseUserToStudentUser(credential.user));
      setStatus(session.ok
        ? "Google login complete. Opening profile setup."
        : "Google login worked, but server session cookies are not configured yet.");
      router.push(readStudentProfile() ? "/dashboard" : "/onboarding");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Google sign-in failed.");
    }
  }

  function continueDemo() {
    const user = createDemoGoogleUser(demoEmail.trim() || "student@gmail.com");
    writeStudentUser(user);
    router.push(readStudentProfile() ? "/dashboard" : "/onboarding");
  }

  return (
    <div className="mx-auto grid min-h-screen max-w-6xl items-center gap-5 px-4 py-10 sm:px-6 lg:grid-cols-[0.88fr_1.12fr] lg:px-8">
      <InkPanel className="relative overflow-hidden p-6 sm:p-8">
        <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-white/45 to-transparent" />
        <Badge className="bg-white text-[#081018]"><L2Logo markClassName="text-lg" /> / Learn2 Learn</Badge>
        <h1 className="mt-5 max-w-xl text-4xl font-black text-white sm:text-5xl">One Gmail profile. Every mock, hint, and result linked cleanly.</h1>
        <p className="mt-4 max-w-xl text-sm leading-6 text-white/68">
          Students sign in once, complete the boot setup, and L² tailors the cockpit to their board, level, and registered subjects. Firebase owns Google identity; Supabase owns the QP/MS resource and progress database.
        </p>
        <div className="mt-7 grid gap-3 text-sm text-white/72 sm:grid-cols-3">
          {[
            ["Auth", "Google OAuth session and secure cookies."],
            ["Profile", "Board, level, subjects, and targets."],
            ["Records", "Saved attempts scoped to the student."],
          ].map(([label, copy]) => (
            <div key={label} className="rounded-lg border border-white/10 bg-white/8 p-4">
              <CheckCircle2 className="h-5 w-5 text-[var(--green)]" />
              <p className="mt-3 font-black text-white">{label}</p>
              <p className="mt-1 text-xs leading-5 text-white/55">{copy}</p>
            </div>
          ))}
        </div>
      </InkPanel>

      <GlassPanel className="p-6 sm:p-8">
        <Badge>{firebaseReady ? "Firebase Google ready" : "Local demo mode"}</Badge>
        <h2 className="mt-4 text-3xl font-black text-ink">Student login</h2>
        <p className="mt-2 text-sm leading-6 text-soft">
          Production uses Gmail through Firebase. Supabase receives the Firebase token for resource access, grading records, and RLS.
        </p>
        <div className="mt-6 grid gap-3">
          <Button size="lg" className="w-full justify-center" onClick={handleGoogleSignIn}>
            <Mail className="h-4 w-4" /> Continue with Google
          </Button>
          {!firebaseReady && (
            <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] p-3">
              <label className="text-xs font-black uppercase text-muted" htmlFor="demo-email">Demo Gmail</label>
              <input
                id="demo-email"
                type="email"
                value={demoEmail}
                onChange={(event) => setDemoEmail(event.target.value)}
                className="mt-2 h-11 w-full rounded-md border border-[var(--border)] bg-[var(--surface-strong)] px-3 text-sm text-ink outline-none transition focus:border-[var(--cyan)] focus:shadow-[var(--glow-cyan)]"
                placeholder="student@gmail.com"
              />
              <Button variant="secondary" className="mt-3 w-full justify-center" onClick={continueDemo}>
                Use demo Gmail profile <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
        <div className="mt-5 rounded-lg border border-[var(--green)]/30 bg-[var(--green)]/10 p-4">
          <div className="flex gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[var(--green)]" />
            <p className="text-sm leading-6 text-soft">{status}</p>
          </div>
        </div>
      </GlassPanel>
    </div>
  );
}
