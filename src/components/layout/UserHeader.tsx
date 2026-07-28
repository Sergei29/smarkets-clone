"use client"

import { useSession } from "next-auth/react"
import LogoutButton from "@/components/auth/LogoutButton"

/** App header: shows the safe profile (name/email) and the logout control. */
const UserHeader = () => {
  const { data: session } = useSession()
  const user = session?.user

  const displayName = user
    ? [user.givenName, user.familyName].filter(Boolean).join(" ") || user.email
    : null

  return (
    <header className="flex items-center justify-between border-b px-4 py-3">
      <span className="text-lg font-semibold">Smarkets</span>
      <div className="flex items-center gap-3">
        {displayName && (
          <span className="text-sm text-muted-foreground">{displayName}</span>
        )}
        <LogoutButton />
      </div>
    </header>
  )
}

export default UserHeader
