import Link from "next/link"
import type { ReactNode } from "react"
import LogoutButton from "@/components/auth/LogoutButton"
import ThemeToggle from "@/components/layout/ThemeToggle"

/**
 * Static app header chrome. The brand link, theme toggle and logout control
 * never depend on the session, so this renders immediately with no `"use
 * client"`/`useSession()` of its own. `children` is the session-dependent
 * profile-name slot (see `UserDisplayName`), streamed in separately once
 * `auth()` resolves — see `(protected)/layout.tsx`.
 */
const UserHeader = ({ children }: { children?: ReactNode }) => (
  <header className="flex items-center justify-between border-b px-4 py-3">
    <Link href="/" className="text-lg font-semibold">
      Smarkets
    </Link>
    <div className="flex items-center gap-3">
      {children}
      <ThemeToggle />
      <LogoutButton />
    </div>
  </header>
)

export default UserHeader
