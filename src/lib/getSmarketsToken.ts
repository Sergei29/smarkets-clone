import "server-only"

import { getToken } from "next-auth/jwt"
import type { JWT } from "next-auth/jwt"
import { env } from "@/lib/env"

/**
 * Decode the augmented Auth.js JWT (including the server-only `smkToken`) for
 * the current request. Used by protected Route Handlers and server data
 * functions that need to forward the Smarkets Session-Token upstream — the
 * token is never available through `auth()`/`useSession()`.
 *
 * `secureCookie` selects the cookie name (`__Secure-authjs.session-token` vs
 * `authjs.session-token`) and the decode salt; it must match how the cookie was
 * written, which tracks `NODE_ENV` here (https in production).
 */
export const getSmarketsToken = (req: Request): Promise<JWT | null> =>
  getToken({
    req,
    secret: env.AUTH_SECRET,
    secureCookie: process.env.NODE_ENV === "production",
  })
