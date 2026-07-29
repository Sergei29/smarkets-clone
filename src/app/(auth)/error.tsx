"use client"

import { useEffect } from "react"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { ErrorPageProps } from "@/types"

/**
 * Route-segment error boundary for the unauthenticated pages. Catches
 * rendering errors without tearing down `(auth)/layout.tsx` — the theme
 * toggle keeps working.
 */
const AuthError = ({ error, reset }: ErrorPageProps) => {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <Card size="sm" className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Something went wrong</CardTitle>
        <CardDescription>
          {error.message || "An unexpected error occurred."}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-start gap-3">
        {error.digest && (
          <span className="text-xs text-muted-foreground">
            Reference: {error.digest}
          </span>
        )}
        <Button variant="outline" size="sm" onClick={reset}>
          Try again
        </Button>
      </CardContent>
    </Card>
  )
}

export default AuthError
