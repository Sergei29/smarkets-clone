"use client"

import { useSession } from "next-auth/react"

/**
 * The safe profile's display name (falling back to email) — the only piece of
 * the header that actually needs `useSession()`. Isolated from `UserHeader` so
 * the rest of the header chrome doesn't have to wait on the session.
 */
const UserDisplayName = () => {
  const { data: session } = useSession()
  const user = session?.user
  if (!user) return null

  const displayName =
    [user.givenName, user.familyName].filter(Boolean).join(" ") || user.email

  return <span className="text-sm text-muted-foreground">{displayName}</span>
}

export default UserDisplayName
