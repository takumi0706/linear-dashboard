import { NextResponse } from "next/server";
import { revokeToken } from "@/lib/auth/oauth";
import { getSession, deleteSession } from "@/lib/auth/session";

export async function POST() {
  const session = await getSession();

  if (session?.accessToken) {
    try {
      await revokeToken(session.accessToken);
    } catch {
      // Ignore revocation errors
    }
  }

  await deleteSession();

  return NextResponse.json({ success: true });
}
