import { NextResponse } from "next/server"
import { auth, invalidateUpstreamSession } from "@/lib/auth"
import { getSmarketsToken } from "@/lib/getSmarketsToken"

/**
 * Best-effort upstream logout. Reads the server-only Smarkets token from the
 * JWT and invalidates the upstream session, then always returns success so the
 * client can clear the local Auth.js session via `signOut()` regardless of the
 * upstream outcome. Independently enforces authentication (does not rely on the
 * proxy).
 */
export const POST = async (req: Request) => {
  const session = await auth()
  if (!session) {
    return NextResponse.json(
      { error: "unauthorized", message: "Not authenticated" },
      { status: 401 },
    )
  }

  const token = await getSmarketsToken(req)
  if (token?.smkToken) {
    await invalidateUpstreamSession(token.smkToken)
  }

  return NextResponse.json({ success: true })
}
