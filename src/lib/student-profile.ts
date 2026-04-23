"use client";

import type { ExamBoard, Qualification } from "@/lib/types";

export const L2L_USER_KEY = "l2l:student-user";
export const L2L_PROFILE_KEY = "l2l:student-profile";

export type StudentUser = {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  provider: "google" | "demo-google";
  createdAt: string;
};

export type StudentProfile = {
  board: ExamBoard;
  qualification: Qualification;
  curriculumTrack: "International" | "National English Version";
  subjects: string[];
  primarySubject: string;
  targetSession: string;
  weeklyMockTarget: number;
  bootCompletedAt: string;
  updatedAt?: string;
};

export const boardOptions: ExamBoard[] = ["Cambridge", "Edexcel", "Bangladesh National English Version"];

export const qualificationOptions: Qualification[] = ["O Level", "A Level", "National Curriculum"];

export const subjectOptions = [
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

export function readStudentUser() {
  return readJson<StudentUser>(L2L_USER_KEY);
}

export function writeStudentUser(user: StudentUser) {
  window.localStorage.setItem(L2L_USER_KEY, JSON.stringify(user));
  writeCookie("l2l_student_email", user.email);
}

export function readStudentProfile() {
  return readJson<StudentProfile>(L2L_PROFILE_KEY);
}

export function writeStudentProfile(profile: StudentProfile) {
  window.localStorage.setItem(L2L_PROFILE_KEY, JSON.stringify(profile));
  writeCookie("l2l_profile_ready", "true");
}

export function clearStudentSession() {
  window.localStorage.removeItem(L2L_USER_KEY);
  window.localStorage.removeItem(L2L_PROFILE_KEY);
  expireCookie("l2l_student_email");
  expireCookie("l2l_profile_ready");
}

export function createDemoGoogleUser(email = "student@gmail.com"): StudentUser {
  return {
    id: `demo-google-${email.toLowerCase()}`,
    email,
    name: email.split("@")[0].replace(/[._-]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase()),
    provider: "demo-google",
    createdAt: new Date().toISOString(),
  };
}

export function defaultStudentProfile(): StudentProfile {
  return {
    board: "Cambridge",
    qualification: "O Level",
    curriculumTrack: "International",
    subjects: ["Physics"],
    primarySubject: "Physics",
    targetSession: "Oct/Nov 2025",
    weeklyMockTarget: 2,
    bootCompletedAt: new Date().toISOString(),
  };
}

function readJson<T>(key: string): T | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeCookie(name: string, value: string) {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=31536000; samesite=lax`;
}

function expireCookie(name: string) {
  document.cookie = `${name}=; path=/; max-age=0; samesite=lax`;
}
