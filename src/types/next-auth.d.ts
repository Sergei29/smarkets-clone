import type { SmarketsSessionUser } from "@/types"

/**
 * Module augmentation for Auth.js.
 *
 * Invariant: the Smarkets session token (`smkToken`) and refresh token live
 * ONLY on the server-side `JWT` and the transient `User` returned by
 * `authorize()`. They are never copied onto `Session`, so they can never reach
 * the browser through `useSession()` / `auth()`.
 */

declare module "next-auth" {
  /** Client-visible session. Only safe profile fields — no tokens. */
  interface Session {
    user: SmarketsSessionUser
  }

  /**
   * The object returned by `authorize()` and passed to the `jwt` callback.
   * Carries the safe profile plus the server-only tokens (stripped before they
   * reach the session).
   */
  interface User {
    memberId: number
    givenName: string | null
    familyName: string | null
    currency: string | null
    country: string | null
    betPermission: boolean
    permittedCountry: boolean
    smkToken: string
    smkRefreshToken: string | null
  }
}

declare module "next-auth/jwt" {
  /** Server-only JWT payload (encrypted in the HTTP-only cookie). */
  interface JWT {
    smkToken: string
    smkRefreshToken: string | null
    profile: SmarketsSessionUser
  }
}
