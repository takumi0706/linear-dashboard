import { NextResponse } from "next/server";
import {
  generateState,
  generateCodeVerifier,
  generateCodeChallenge,
  buildAuthorizationUrl,
} from "@/lib/auth/oauth";
import { setPkceVerifier, setOAuthState } from "@/lib/auth/session";

export async function GET() {
  const state = generateState();
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = generateCodeChallenge(codeVerifier);

  await setPkceVerifier(codeVerifier);
  await setOAuthState(state);

  const authUrl = buildAuthorizationUrl(state, codeChallenge);
  return NextResponse.redirect(authUrl);
}
