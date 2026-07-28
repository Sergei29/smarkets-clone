"use client"

import { useState } from "react"
import { signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"

/**
 * Logout flow: call the protected `/api/smarkets/logout` route (best-effort
 * upstream invalidation), then always clear the local Auth.js session via
 * `signOut()` — even if the upstream call fails.
 */
const LogoutButton = () => {
  const [isPending, setIsPending] = useState(false)

  const handleLogout = async () => {
    setIsPending(true)
    try {
      await fetch("/api/smarkets/logout", { method: "POST" })
    } catch {
      // Ignore — proceed to clear the local session regardless.
    }
    await signOut({ redirectTo: "/login" })
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleLogout}
      disabled={isPending}
    >
      {isPending ? "Signing out…" : "Sign out"}
    </Button>
  )
}

export default LogoutButton
