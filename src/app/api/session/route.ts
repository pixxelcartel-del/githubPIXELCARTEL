import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getFirebaseAdminAuth, isFirebaseAdminConfigured } from "@/lib/firebase/admin";

const SESSION_COOKIE_NAME = "l2l_session";
const SESSION_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 5;

export async function POST(request: Request) {
  if (!isFirebaseAdminConfigured()) {
    return NextResponse.json({ error: "Firebase Admin is not configured." }, { status: 503 });
  }

  const { idToken } = await request.json().catch(() => ({ idToken: null }));
  if (!idToken || typeof idToken !== "string") {
    return NextResponse.json({ error: "Missing Firebase ID token." }, { status: 400 });
  }

  const auth = getFirebaseAdminAuth();
  const decoded = await auth.verifyIdToken(idToken);
  const user = await auth.getUser(decoded.uid);
  await auth.setCustomUserClaims(decoded.uid, {
    ...(user.customClaims ?? {}),
    role: "authenticated",
  });

  const sessionCookie = await auth.createSessionCookie(idToken, { expiresIn: SESSION_MAX_AGE_MS });
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, sessionCookie, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: Math.floor(SESSION_MAX_AGE_MS / 1000),
  });

  return NextResponse.json({ ok: true, firebaseUid: decoded.uid, refreshToken: true });
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
  return NextResponse.json({ ok: true });
}
