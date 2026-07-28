import { http, HttpResponse } from "msw"
import {
  validCredentials,
  mfaCredentials,
  sessionSuccessFixture,
  sessionMfaRequiredFixture,
  profileFixture,
  logoutSuccessFixture,
} from "../fixtures/authFixtures"

const BASE = "https://api.smarkets.com"

type LoginBody = { username?: string; password?: string }

/** Uniform upstream error envelope: { error_type, data }. */
const upstreamError = (
  error_type: string,
  status: number,
  data: unknown = {},
) => HttpResponse.json({ error_type, data }, { status })

/**
 * Default happy-path auth handlers:
 * - `validCredentials` -> 201 complete session
 * - `mfaCredentials` -> 201 session requiring an unsupported MFA factor
 * - anything else -> 401 invalid credentials
 * - profile lookup always succeeds
 * - logout always succeeds
 *
 * Tests needing "profile retrieval failure after login" or "expired session"
 * should override with `server.use(...)` and the exported factories below.
 */
export const upstreamAuthHandlers = [
  http.post(`${BASE}/v3/sessions/`, async ({ request }) => {
    const body = (await request.json()) as LoginBody

    if (
      body.username === validCredentials.username &&
      body.password === validCredentials.password
    ) {
      return HttpResponse.json(sessionSuccessFixture, { status: 201 })
    }

    if (
      body.username === mfaCredentials.username &&
      body.password === mfaCredentials.password
    ) {
      return HttpResponse.json(sessionMfaRequiredFixture, { status: 201 })
    }

    return upstreamError("INVALID_CREDENTIALS", 401)
  }),

  http.get(`${BASE}/v0/users/current/info-without-rate/`, () => {
    return HttpResponse.json(profileFixture, { status: 200 })
  }),

  http.delete(`${BASE}/v0/sessions/current/`, () => {
    return HttpResponse.json(logoutSuccessFixture, { status: 200 })
  }),
]

/** Scenario: profile retrieval fails after a successful login. */
export const profileFailureHandler = http.get(
  `${BASE}/v0/users/current/info-without-rate/`,
  () => upstreamError("UNAVAILABLE", 503),
)

/** Scenario: the upstream session has expired (401 on an authenticated call). */
export const expiredSessionHandler = http.get(
  `${BASE}/v0/users/current/info-without-rate/`,
  () => upstreamError("SESSION_EXPIRED", 401),
)

/** Scenario: upstream logout invalidation fails (client still clears locally). */
export const logoutFailureHandler = http.delete(
  `${BASE}/v0/sessions/current/`,
  () => upstreamError("UNAVAILABLE", 503),
)
