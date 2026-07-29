import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { env } from "@/lib/env"
import {
  authorize,
  buildTokenFromUser,
  buildClientSession,
} from "@/lib/authFlows"

/**
 * Auth.js configuration. Deliberately thin: the testable login/session-shaping
 * logic lives in `src/lib/authFlows.ts` — importing the root `next-auth`
 * package (needed here for `NextAuth`/`Credentials`) pulls in a `next/server`
 * dependency Vitest's resolver can't load, so this module itself is never
 * imported by a unit test; only `authFlows.ts` is.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: env.AUTH_SECRET,
  trustHost: true,
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: { username: {}, password: {} },
      authorize,
    }),
  ],
  callbacks: {
    jwt: async ({ token, user }) => {
      // First sign-in only: `user` is the object `authorize()` returned, but
      // NextAuth widens the callback's type to the generic `User | AdapterUser`.
      if (user) {
        Object.assign(
          token,
          buildTokenFromUser(user as Awaited<ReturnType<typeof authorize>>),
        )
      }
      return token
    },
    session: async ({ session, token }) =>
      buildClientSession(session, token.profile),
  },
})

export { invalidateUpstreamSession } from "@/lib/authFlows"
