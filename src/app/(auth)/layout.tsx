import type { Metadata } from "next"
import type { PropsWithChildren } from "react"
import ThemeToggle from "@/components/layout/ThemeToggle"
import { env } from "@/lib/env"

export const metadata: Metadata = {
  title: {
    template: `%s · Authentication | ${env.NEXT_PUBLIC_APP_NAME}`,
    default: "Authentication",
  },
  description:
    "Login to your Smarkets account or create a new one to start trading and place bets beyond your wildest dreams, and may win a lot, or not.",
}

const AuthPagesLayout = ({ children }: PropsWithChildren) => {
  return (
    <main className="relative flex min-h-full items-center justify-center p-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      {children}
    </main>
  )
}

export default AuthPagesLayout
