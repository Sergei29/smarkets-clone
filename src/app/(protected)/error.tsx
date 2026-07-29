"use client"

import { useEffect } from "react"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import type { ErrorPageProps } from "@/types"

/**
 * Route-segment error boundary for the authenticated app shell. Catches
 * rendering errors from the protected pages (homepage, event page) without
 * tearing down `(protected)/layout.tsx` — the header keeps working.
 */
const ProtectedError = ({ error, reset }: ErrorPageProps) => {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="mx-auto max-w-5xl p-4">
      <Alert variant="destructive">
        <AlertTitle>Something went wrong</AlertTitle>
        <AlertDescription className="flex flex-col items-start gap-3">
          <span>{error.message || "An unexpected error occurred."}</span>
          {error.digest && (
            <span className="text-xs opacity-70">
              Reference: {error.digest}
            </span>
          )}
          <Button variant="outline" size="sm" onClick={reset}>
            Try again
          </Button>
        </AlertDescription>
      </Alert>
    </div>
  )
}

export default ProtectedError
