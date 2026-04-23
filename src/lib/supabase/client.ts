"use client";

import { createBrowserClient } from "@supabase/ssr";
import { currentFirebaseToken, isFirebaseConfigured } from "@/lib/firebase/client";

export function isSupabaseConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  }

  return createBrowserClient(url, anonKey, {
    accessToken: isFirebaseConfigured()
      ? async () => currentFirebaseToken(false)
      : undefined,
  });
}

export function createOptionalClient() {
  if (!isSupabaseConfigured()) {
    return null;
  }

  return createClient();
}
