"use client";

import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { browserLocalPersistence, getAuth, GoogleAuthProvider, onAuthStateChanged, setPersistence, signInWithPopup, type User } from "firebase/auth";
import type { StudentUser } from "@/lib/student-profile";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
};

export function isFirebaseConfigured() {
  return Boolean(
    firebaseConfig.apiKey &&
      firebaseConfig.authDomain &&
      firebaseConfig.projectId &&
      firebaseConfig.appId,
  );
}

export function getFirebaseApp(): FirebaseApp {
  if (!isFirebaseConfigured()) {
    throw new Error("Missing Firebase public environment variables.");
  }

  return getApps().length ? getApp() : initializeApp(firebaseConfig);
}

export function getFirebaseAuth() {
  return getAuth(getFirebaseApp());
}

export async function signInWithGoogle() {
  const auth = getFirebaseAuth();
  await setPersistence(auth, browserLocalPersistence);
  return signInWithPopup(auth, new GoogleAuthProvider());
}

export async function currentFirebaseToken(forceRefresh = false) {
  if (!isFirebaseConfigured()) {
    return null;
  }

  return (await getFirebaseAuth().currentUser?.getIdToken(forceRefresh)) ?? null;
}

export { onAuthStateChanged };

export function firebaseUserToStudentUser(user: User): StudentUser {
  return {
    id: user.uid,
    email: user.email ?? "student@gmail.com",
    name: user.displayName ?? user.email?.split("@")[0] ?? "Student",
    avatarUrl: user.photoURL ?? undefined,
    provider: "google",
    createdAt: user.metadata.creationTime ?? new Date().toISOString(),
  };
}
