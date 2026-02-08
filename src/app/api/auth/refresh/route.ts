import { NextResponse } from "next/server";
import { refreshAccessToken } from "@/lib/auth/oauth";
import { getSession, createSession } from "@/lib/auth/session";

export async function POST() {
  const session = await getSession();

  if (!session?.refreshToken) {
    return NextResponse.json({ error: "No session or refresh token" }, { status: 401 });
  }

  try {
    const tokenResponse = await refreshAccessToken(session.refreshToken);

    await createSession({
      accessToken: tokenResponse.access_token,
      refreshToken: tokenResponse.refresh_token ?? null,
      expiresAt: Date.now() + tokenResponse.expires_in * 1000,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Refresh failed";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
