import "server-only"

import { smarketsFetch } from "./smarketsClient"
import { sessionResponseSchema } from "./schemas"
import type { SmarketsSession } from "@/types"

/**
 * Create a Smarkets session (login). HAR-confirmed contract:
 * `POST /v3/sessions/` with JSON credentials, success `201`.
 * Throws a structured `SmarketsError` on non-2xx (e.g. 401 invalid credentials).
 */
export const createSmarketsSession = (credentials: {
  username: string
  password: string
}): Promise<SmarketsSession> =>
  smarketsFetch("/v3/sessions/", {
    method: "POST",
    body: {
      username: credentials.username,
      password: credentials.password,
      remember: false,
      create_social_member: true,
    },
    schema: sessionResponseSchema,
  })

/**
 * Best-effort upstream logout: `DELETE /v0/sessions/current/` with the
 * server-only Session-Token. Callers should swallow failures and still clear
 * the local session.
 */
export const deleteSmarketsSession = (token: string): Promise<unknown> =>
  smarketsFetch("/v0/sessions/current/", {
    method: "DELETE",
    token,
  })
