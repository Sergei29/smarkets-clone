"use client"

import { SessionProvider } from "next-auth/react"
import type { Session } from "next-auth"
import QueryProvider from "./QueryProvider"

/**
 * Root client provider composition: Auth.js `SessionProvider` (makes the safe
 * profile available via `useSession()` — never the token) wrapping the TanStack
 * Query provider. The initial session is passed from the server so the profile
 * is available on first client render without a refetch.
 */
const AppProviders = ({
  children,
  session,
}: {
  children: React.ReactNode
  session: Session | null
}) => {
  return (
    <SessionProvider session={session}>
      <QueryProvider>{children}</QueryProvider>
    </SessionProvider>
  )
}

export default AppProviders
