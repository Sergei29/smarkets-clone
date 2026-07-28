import NextAuth, { CredentialsSignin } from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { z } from "zod"
import { env } from "@/lib/env"
import {
  createSmarketsSession,
  deleteSmarketsSession,
} from "@/lib/smarkets/sessions"
import { getSmarketsProfile, toSessionUser } from "@/lib/smarkets/profile"
import { isSmarketsError } from "@/lib/smarkets/errors"

/**
 * Distinct sign-in errors. `code` is surfaced to the client via
 * `SignInResponse.code` (and the redirect URL) so the LoginForm can show a
 * specific message; the full underlying error is only ever logged server-side.
 */
class InvalidCredentialsError extends CredentialsSignin {
  code = "invalid_credentials"
}
class MfaRequiredError extends CredentialsSignin {
  code = "mfa_required"
}
class ProfileUnavailableError extends CredentialsSignin {
  code = "profile_unavailable"
}
class LoginUnavailableError extends CredentialsSignin {
  code = "login_unavailable"
}

const credentialsSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
})

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: env.AUTH_SECRET,
  trustHost: true,
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: { username: {}, password: {} },
      authorize: async (raw) => {
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
      },
    }),
  ],
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        // First sign-in: persist tokens (server-only) + safe profile on the JWT.
        token.smkToken = user.smkToken
        token.smkRefreshToken = user.smkRefreshToken
        token.profile = {
          id: user.id as string,
          email: user.email as string,
          memberId: user.memberId,
          givenName: user.givenName,
          familyName: user.familyName,
          currency: user.currency,
          country: user.country,
          betPermission: user.betPermission,
          permittedCountry: user.permittedCountry,
        }
      }
      return token
    },
    session: async ({ session, token }) => {
      // Expose ONLY the safe profile — never smkToken/smkRefreshToken. Returned
      // as a fresh object because the callback types `session.user` as an
      // AdapterUser intersection (emailVerified etc.) that our JWT sessions
      // never carry.
      return { ...session, user: token.profile }
    },
  },
})

/**
 * Best-effort upstream logout. Extracted so it can be reused by the
 * `/api/smarkets/logout` route and unit-tested (it must swallow upstream
 * failures so the local sign-out always proceeds).
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
