import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"

/**
 * Route protection (Next.js 16 `proxy.ts`, formerly `middleware.ts`).
 *
 * - Unauthenticated users may only reach `/login`; any other matched page
 *   redirects to `/login?callbackUrl=<original>`.
 * - Authenticated users visiting `/login` are redirected to `/`.
 *
 * `/api/*` is excluded from the matcher: API routes must not be redirected to
 * an HTML login page, and protected Route Handlers enforce `auth()` themselves
 * (defence in depth — never rely on the proxy alone).
 */
export default auth((req) => {
  const { nextUrl } = req
  const isLoggedIn = Boolean(req.auth)
  const isOnLogin = nextUrl.pathname === "/login"

  if (isOnLogin) {
    if (isLoggedIn) return NextResponse.redirect(new URL("/", nextUrl))
    return NextResponse.next()
  }

  if (!isLoggedIn) {
    const loginUrl = new URL("/login", nextUrl)
    loginUrl.searchParams.set(
      "callbackUrl",
      `${nextUrl.pathname}${nextUrl.search}`,
    )
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
