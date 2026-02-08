import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import type { AuthTokens } from "@/lib/linear/types";

const SESSION_COOKIE = "linear-dashboard-session";
const PKCE_COOKIE = "linear-pkce";
const STATE_COOKIE = "linear-state";

function getSessionSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("Missing SESSION_SECRET environment variable");
  }
  return new TextEncoder().encode(secret);
}

export async function createSession(tokens: AuthTokens): Promise<void> {
  const secret = getSessionSecret();

  const jwt = await new SignJWT({
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    expiresAt: tokens.expiresAt,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(secret);

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, jwt, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export async function getSession(): Promise<AuthTokens | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE);

  if (!sessionCookie) {
    return null;
  }

  try {
    const secret = getSessionSecret();
    const { payload } = await jwtVerify(sessionCookie.value, secret);

    return {
      accessToken: payload.accessToken as string,
      refreshToken: (payload.refreshToken as string) ?? null,
      expiresAt: payload.expiresAt as number,
    };
  } catch {
    return null;
  }
}

export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function setPkceVerifier(verifier: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(PKCE_COOKIE, verifier, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10, // 10 minutes
  });
}

export async function getPkceVerifier(): Promise<string | null> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(PKCE_COOKIE);
  if (cookie) {
    cookieStore.delete(PKCE_COOKIE);
  }
  return cookie?.value ?? null;
}

export async function setOAuthState(state: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10, // 10 minutes
  });
}

export async function getOAuthState(): Promise<string | null> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(STATE_COOKIE);
  if (cookie) {
    cookieStore.delete(STATE_COOKIE);
  }
  return cookie?.value ?? null;
}
