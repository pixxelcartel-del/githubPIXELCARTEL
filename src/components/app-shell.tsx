"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BookOpenCheck, GraduationCap, LayoutDashboard, LogIn, LogOut, Orbit, RotateCcw, Sparkles, Trophy } from "lucide-react";
import { useEffect, useState } from "react";
import { L2Logo } from "@/components/l2-logo";
import { ThemeToggle } from "@/components/theme-provider";
import { Badge } from "@/components/ui/badge";
import { clearStudentSession, readStudentProfile, readStudentUser, type StudentProfile, type StudentUser } from "@/lib/student-profile";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/onboarding", label: "Profile Setup", icon: GraduationCap },
  { href: "/papers/5054-w25-21", label: "Practice Library", icon: BookOpenCheck },
  { href: "/exam/demo-attempt", label: "Paper Diary", icon: Orbit },
  { href: "/results/demo-attempt", label: "Results Audit", icon: Trophy },
  { href: "/login", label: "Login", icon: LogIn },
];

export function AppShell({ children, className }: { children: React.ReactNode; className?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<StudentUser | null>(null);
  const [profile, setProfile] = useState<StudentProfile | null>(null);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) {
        return;
      }

      setUser(readStudentUser());
      setProfile(readStudentProfile());
    });
    return () => {
      active = false;
    };
  }, [pathname]);

  async function signOut() {
    const { getFirebaseAuth, isFirebaseConfigured } = await import("@/lib/firebase/client");
    if (isFirebaseConfigured()) {
      await getFirebaseAuth().signOut();
    }
    await fetch("/api/session", { method: "DELETE" }).catch(() => undefined);
    clearStudentSession();
    setUser(null);
    setProfile(null);
    router.push("/login");
  }

  return (
    <div className="l2-bg min-h-screen text-ink">
      <aside className="fixed inset-y-6 left-6 z-30 hidden w-[220px] overflow-hidden rounded-lg border border-white/12 bg-[linear-gradient(145deg,rgba(4,8,12,0.96),rgba(14,25,31,0.88))] px-3 py-4 text-white shadow-[0_26px_80px_rgba(0,0,0,0.34)] backdrop-blur-2xl lg:block">
        <div className="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
        <div className="pointer-events-none absolute -right-16 top-10 h-40 w-40 rounded-full bg-[var(--cyan)]/10 blur-3xl" />

        <Link href="/dashboard" className="group relative flex items-center gap-3 rounded-lg p-2 transition hover:bg-white/8">
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-white text-base font-black text-[#081018] shadow-[var(--glow-cyan)]">
            <L2Logo markClassName="text-2xl" />
          </span>
          <span>
            <span className="block text-base font-black tracking-normal">L<sup>2</sup></span>
            <span className="block text-[11px] font-bold text-[var(--cyan)]">Learn2 Learn</span>
          </span>
        </Link>

        <div className="relative mt-5 rounded-lg border border-white/10 bg-white/7 p-3">
          <p className="text-[11px] font-black uppercase tracking-normal text-white/45">Student route</p>
          <p className="mt-1 text-sm font-black">{profile ? `${profile.board} / ${profile.qualification}` : "Student route pending"}</p>
          <div className="mt-3 space-y-2">
            <Badge className="border-[var(--cyan)]/30 bg-[var(--cyan)]/12 text-white">{profile ? `${profile.primarySubject} active` : "Profile setup needed"}</Badge>
            <div className="flex items-center gap-2 text-[11px] font-semibold text-white/48">
              <Sparkles className="h-3.5 w-3.5 text-[var(--gold)]" />
              Preloaded QP/MS library
            </div>
            {user && <p className="truncate text-[11px] font-semibold text-white/42">{user.email}</p>}
          </div>
        </div>

        <nav className="relative mt-5 space-y-1">
          {nav.map((item) => {
            const root = item.href.split("/")[1];
            const active = pathname === item.href || (root ? pathname.startsWith(`/${root}`) : false);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-bold text-white/58 transition hover:bg-white/10 hover:text-white",
                  active && "bg-[var(--cyan)] text-[#061017] shadow-[0_0_28px_rgba(20,199,235,0.28)] hover:bg-[var(--cyan)] hover:text-[#061017]",
                )}
              >
                <item.icon className={cn("h-4 w-4 text-[var(--cyan)] transition group-hover:scale-110", active && "text-[#061017]")} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-4 left-4 right-4 space-y-3">
          <ThemeToggle />
          {user && (
            <button
              type="button"
              onClick={signOut}
              className="flex w-full items-center gap-2 rounded-lg border border-white/10 bg-white/7 px-3 py-2 text-left text-xs font-black text-white/62 transition hover:bg-white/12 hover:text-white"
            >
              <LogOut className="h-3.5 w-3.5 text-[var(--rose)]" />
              Sign out
            </button>
          )}
          <div className="rounded-lg border border-[var(--green)]/35 bg-[var(--green)]/10 p-3 text-xs leading-5 text-[#dffef1]">
            <div className="flex items-center gap-2 font-black text-white">
              <RotateCcw className="h-3.5 w-3.5 text-[var(--green)]" />
              Scan, star, answer.
            </div>
            <p className="mt-2 text-white/58">Stars are simple batch toggles beside top-level questions.</p>
          </div>
        </div>
      </aside>

      <main className={cn("min-h-screen pb-24 lg:pl-[268px]", className)}>{children}</main>

      <div className="fixed right-3 top-3 z-40 lg:hidden">
        <ThemeToggle compact />
      </div>

      <nav className="fixed inset-x-3 bottom-3 z-40 grid grid-cols-5 gap-1 rounded-lg border border-[var(--border)] bg-[var(--surface-strong)]/90 p-1 shadow-[var(--shadow)] backdrop-blur-xl lg:hidden">
        {nav.filter((item) => item.href !== "/onboarding").map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 rounded-md px-2 py-2 text-[11px] font-bold text-muted",
                active && "bg-[var(--ink)] text-[var(--background)]",
              )}
            >
              <item.icon className="h-4 w-4" />
              <span className="truncate">{item.label.replace("Practice ", "").replace("Results ", "")}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
