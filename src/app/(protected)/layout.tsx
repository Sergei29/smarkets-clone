import type { Metadata } from "next"
import { Suspense } from "react"
import { auth } from "@/lib/auth"
import AppProviders from "@/providers/AppProviders"
import UserHeader from "@/components/layout/UserHeader"

export const metadata: Metadata = {
  title: "Smarkets",
}

/**
 * Authenticated app shell. `auth()` reads the session cookie (dynamic), so it
 * lives inside a `<Suspense>` boundary per Cache Components rules. The resolved
 * session seeds `SessionProvider` so the safe profile is available on first
 * client render — the Smarkets token is never part of it.
 */
async function AuthedShell({ children }: { children: React.ReactNode }) {
  const session = await auth()

  return (
    <AppProviders session={session}>
      <UserHeader />
      <main className="flex-1">{children}</main>
    </AppProviders>
  )
}

const UserAreaLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode
}>) => {
  return (
    /** TODO: Suspense to replace with loading.tsx and error.tsx pages  */
    <Suspense fallback={<div className="min-h-full" />}>
      <AuthedShell>{children}</AuthedShell>
    </Suspense>
  )
}

export default UserAreaLayout
