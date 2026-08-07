import { CredentialsSignin } from "@auth/core/errors"
import { z } from "zod"
import {
  createSmarketsSession,
  deleteSmarketsSession,
} from "@/lib/smarkets/sessions"
import { getSmarketsProfile, toSessionUser } from "@/lib/smarkets/profile"
import { isSmarketsError } from "@/lib/smarkets/errors"
import type { SmarketsSessionUser } from "@/types"

/**
 * Distinct sign-in errors. `code` is surfaced to the client via
 * `SignInResponse.code` (and the redirect URL) so the LoginForm can show a
 * specific message; the full underlying error is only ever logged server-side.
 *
 * `CredentialsSignin` is imported from `@auth/core/errors` rather than the
 * root `next-auth` package: importing `next-auth` itself pulls in a
 * `next/server` dependency that Vitest's resolver can't load, which would make
 * this otherwise-pure module untestable. `next-auth` re-exports the identical
 * class from the same place, so this has no behavioral difference.
 */
export class InvalidCredentialsError extends CredentialsSignin {
  code = "invalid_credentials"
}
export class MfaRequiredError extends CredentialsSignin {
  code = "mfa_required"
}
export class ProfileUnavailableError extends CredentialsSignin {
  code = "profile_unavailable"
}
export class LoginUnavailableError extends CredentialsSignin {
  code = "login_unavailable"
}

const credentialsSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
})

/**
 * Exchanges credentials for a Smarkets session, rejects unsupported MFA, then
 * fetches the profile for the safe client-visible fields. Kept isolated from
 * `src/lib/auth.ts` (the `NextAuth(...)` wiring) so it's directly
 * unit-testable with MSW, without going through NextAuth's request/response
 * machinery — see the `CredentialsSignin` import note above.
 */
export const authorize = async (raw: unknown) => {
  const parsed = credentialsSchema.safeParse(raw)
  if (!parsed.success) throw new InvalidCredentialsError()

  // 1. Exchange credentials for a Smarkets session.
  let session
  try {
    session = await createSmarketsSession(parsed.data)
  } catch (error) {
    if (
      isSmarketsError(error) &&
      (error.upstreamStatus === 401 || error.upstreamStatus === 400)
    ) {
      throw new InvalidCredentialsError()
    }
    throw new LoginUnavailableError()
  }

  // 2. Only fully-authenticated sessions are supported (no MFA/TOTP).
  if (session.factor !== "complete") throw new MfaRequiredError()

  // 3. Fetch the profile for the safe, client-visible fields.
  let user
  try {
    const profile = await getSmarketsProfile(session.token)
    user = toSessionUser(profile)
  } catch {
    throw new ProfileUnavailableError()
  }

  // Safe profile + server-only tokens (stripped from the session later).
  return {
    id: user.id,
    email: user.email,
    memberId: user.memberId,
    givenName: user.givenName,
    familyName: user.familyName,
    currency: user.currency,
    country: user.country,
    betPermission: user.betPermission,
    permittedCountry: user.permittedCountry,
    smkToken: session.token,
    smkRefreshToken: session.refresh_token ?? null,
  }
}

/**
 * Shapes the JWT's server-only token fields + safe profile from the `User`
 * `authorize()` returned. Pure and plainly typed (unlike NextAuth's broad
 * callback parameter types), so it's directly unit-testable.
 */
export const buildTokenFromUser = (
  user: Awaited<ReturnType<typeof authorize>>,
): {
  smkToken: string
  smkRefreshToken: string | null
  profile: SmarketsSessionUser
} => ({
  smkToken: user.smkToken,
  smkRefreshToken: user.smkRefreshToken,
  profile: {
    id: user.id,
    email: user.email,
    memberId: user.memberId,
    givenName: user.givenName,
    familyName: user.familyName,
    currency: user.currency,
    country: user.country,
    betPermission: user.betPermission,
    permittedCountry: user.permittedCountry,
  },
})

/**
 * Builds the client-visible session: only the safe profile, never
 * `smkToken`/`smkRefreshToken`. Returns a fresh object because the `session`
 * callback types `session.user` as an `AdapterUser` intersection (`emailVerified`
 * etc.) that our JWT sessions never carry.
 */
export const buildClientSession = <S extends { user: unknown }>(
  session: S,
  profile: SmarketsSessionUser,
): S => ({ ...session, user: profile })

/**
 * Best-effort upstream logout. Isolated here (rather than in `auth.ts`) so it
 * can be reused by the `/api/smarkets/logout` route and unit-tested — it must
 * swallow upstream failures so the local sign-out always proceeds.
 */
export const invalidateUpstreamSession = async (
  token: string,
): Promise<void> => {
  try {
    await deleteSmarketsSession(token)
  } catch {
    // Swallow — the local Auth.js session is cleared regardless.
  }
}
