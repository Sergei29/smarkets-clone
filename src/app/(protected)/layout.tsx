import type { Metadata } from "next"
import { Suspense, type PropsWithChildren } from "react"
import { SessionProvider } from "next-auth/react"
import { auth } from "@/lib/auth"
import { Skeleton } from "@/components/ui/skeleton"
import QueryProvider from "@/providers/QueryProvider"
import UserHeader from "@/components/layout/UserHeader"
import UserDisplayName from "@/components/layout/UserDisplayName"

export const metadata: Metadata = {
  title: "Smarkets",
}

/**
 * Resolves the session — `auth()` reads the session cookie (dynamic), so it
 * must sit inside a `<Suspense>` boundary per Cache Components rules — and
 * seeds `SessionProvider` for just the profile-name slot. Isolated to its own
 * narrow boundary (rather than wrapping the whole shell) so the static header
 * chrome and the page content below never wait on the cookie read.
 */
async function AuthedProfileSlot() {
  const session = await auth()

  return (
    <SessionProvider session={session}>
      <UserDisplayName />
    </SessionProvider>
  )
}

const UserAreaLayout = ({ children }: PropsWithChildren) => {
  return (
    <QueryProvider>
      <UserHeader>
        <Suspense fallback={<Skeleton className="h-4 w-20" />}>
          <AuthedProfileSlot />
        </Suspense>
      </UserHeader>
      <main className="flex-1">{children}</main>
    </QueryProvider>
  )
}

export default UserAreaLayout
