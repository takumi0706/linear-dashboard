import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForTokens } from "@/lib/auth/oauth";
import { createSession, getPkceVerifier, getOAuthState } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  if (error) {
    return NextResponse.redirect(
      `${appUrl}/login?error=${encodeURIComponent(error)}`
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      `${appUrl}/login?error=${encodeURIComponent("Missing code or state parameter")}`
    );
  }

  const savedState = await getOAuthState();
  if (!savedState || savedState !== state) {
    return NextResponse.redirect(
      `${appUrl}/login?error=${encodeURIComponent("Invalid state parameter")}`
    );
  }

  const codeVerifier = await getPkceVerifier();
  if (!codeVerifier) {
    return NextResponse.redirect(
      `${appUrl}/login?error=${encodeURIComponent("Missing PKCE verifier")}`
    );
  }

  try {
    const tokenResponse = await exchangeCodeForTokens(code, codeVerifier);

    await createSession({
      accessToken: tokenResponse.access_token,
      refreshToken: tokenResponse.refresh_token ?? null,
      expiresAt: Date.now() + tokenResponse.expires_in * 1000,
    });

    return NextResponse.redirect(`${appUrl}/dashboard`);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Token exchange failed";
    return NextResponse.redirect(
      `${appUrl}/login?error=${encodeURIComponent(message)}`
    );
  }
}
