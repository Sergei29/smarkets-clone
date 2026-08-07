import type { Metadata } from "next"
import type { PropsWithChildren } from "react"
import { Geist, Geist_Mono } from "next/font/google"

import ThemeProvider from "@/providers/ThemeProvider"
import { env } from "@/lib/env"

import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

/**
 * Build-time only: Gets the build year for the copyright notice.
 */
const BUILD_YEAR = new Date().getFullYear()

export const metadata: Metadata = {
  title: {
    template: `%s | ${env.NEXT_PUBLIC_APP_NAME}`,
    default: env.NEXT_PUBLIC_APP_NAME,
  },
  description:
    "Browse favorite sports teams and place bets beyond your wildest dreams",
}

const RootLayout = ({ children }: PropsWithChildren) => {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}

          <footer className="mt-auto flex h-12 items-center justify-center border-t">
            <p className="text-sm text-muted-foreground">
              &copy; {BUILD_YEAR} {env.NEXT_PUBLIC_APP_NAME}. All rights
              reserved.
            </p>
          </footer>
        </ThemeProvider>
      </body>
    </html>
  )
}

export default RootLayout
