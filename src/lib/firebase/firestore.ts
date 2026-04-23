"use client";

import { doc, getDoc, getFirestore, setDoc } from "firebase/firestore";
import { getFirebaseApp } from "@/lib/firebase/client";
import type { StudentProfile } from "@/lib/student-profile";

export function getFirebaseDb() {
  return getFirestore(getFirebaseApp());
}

export async function readFirestoreStudentProfile(firebaseUid: string) {
  const snapshot = await getDoc(doc(getFirebaseDb(), "students", firebaseUid));
  return snapshot.exists() ? (snapshot.data() as StudentProfile) : null;
}

export async function writeFirestoreStudentProfile(firebaseUid: string, profile: StudentProfile) {
  await setDoc(doc(getFirebaseDb(), "students", firebaseUid), {
    ...profile,
    updatedAt: new Date().toISOString(),
  }, { merge: true });
}
