import { describe, expect, it } from "vitest"
import { HttpResponse, http } from "msw"
import { server } from "@/mocks/server"
import {
  validCredentials,
  mfaCredentials,
  sessionSuccessFixture,
  profileFixture,
} from "@/mocks/fixtures/authFixtures"
import {
  profileFailureHandler,
  logoutFailureHandler,
} from "@/mocks/handlers/upstreamAuthHandlers"
import {
  authorize,
  buildTokenFromUser,
  buildClientSession,
  invalidateUpstreamSession,
  InvalidCredentialsError,
  MfaRequiredError,
  ProfileUnavailableError,
  LoginUnavailableError,
} from "./authFlows"
import type { SmarketsSessionUser } from "@/types"

const BASE = "https://api.smarkets.com"

describe("authorize", () => {
  it("returns the safe profile plus the server-only tokens for valid credentials", async () => {
    const user = await authorize(validCredentials)

    expect(user).toEqual({
      id: profileFixture.id_slug,
      email: profileFixture.email,
      memberId: profileFixture.member_id,
      givenName: profileFixture.given_name,
      familyName: profileFixture.family_name,
      currency: profileFixture.currency,
      country: profileFixture.country,
      betPermission: profileFixture.bet_permission,
      permittedCountry: profileFixture.permitted_country,
      smkToken: sessionSuccessFixture.token,
      smkRefreshToken: sessionSuccessFixture.refresh_token,
    })
  })

  it("rejects malformed credentials without calling upstream", async () => {
    server.use(
      http.post(`${BASE}/v3/sessions/`, () => {
        throw new Error("should not be called")
      }),
    )

    await expect(authorize({ username: "", password: "" })).rejects.toThrow(
      InvalidCredentialsError,
    )
  })

  it("throws InvalidCredentialsError for invalid credentials", async () => {
    await expect(
      authorize({ username: "nobody@example.com", password: "wrong" }),
    ).rejects.toThrow(InvalidCredentialsError)
  })

  it("throws MfaRequiredError for an account requiring an unsupported MFA factor", async () => {
    await expect(authorize(mfaCredentials)).rejects.toThrow(MfaRequiredError)
  })

  it("throws ProfileUnavailableError when profile retrieval fails after a successful login", async () => {
    server.use(profileFailureHandler)

    await expect(authorize(validCredentials)).rejects.toThrow(
      ProfileUnavailableError,
    )
  })

  it("throws LoginUnavailableError when the login call itself fails", async () => {
    server.use(
      http.post(`${BASE}/v3/sessions/`, () =>
        HttpResponse.json(
          { error_type: "UNAVAILABLE", data: {} },
          { status: 503 },
        ),
      ),
    )

    await expect(authorize(validCredentials)).rejects.toThrow(
      LoginUnavailableError,
    )
  })
})

const sessionUser: SmarketsSessionUser = {
  id: "test-user",
  memberId: 123456,
  email: "test.user@example.com",
  givenName: "Test",
  familyName: "User",
  currency: "GBP",
  country: "GB",
  betPermission: true,
  permittedCountry: true,
}

const authorizedUser = {
  ...sessionUser,
  smkToken: "mock-session-token",
  smkRefreshToken: "mock-refresh-token" as string | null,
}

describe("buildTokenFromUser", () => {
  it("carries the tokens and safe profile onto the JWT shape", () => {
    expect(buildTokenFromUser(authorizedUser)).toEqual({
      smkToken: "mock-session-token",
      smkRefreshToken: "mock-refresh-token",
      profile: sessionUser,
    })
  })

  it("preserves a null refresh token", () => {
    const result = buildTokenFromUser({
      ...authorizedUser,
      smkRefreshToken: null,
    })
    expect(result.smkRefreshToken).toBeNull()
  })
})

describe("buildClientSession", () => {
  it("exposes only the safe profile on session.user", () => {
    const session = buildClientSession(
      { user: undefined, expires: "2026-08-01T00:00:00Z" },
      sessionUser,
    )
    expect(session.user).toEqual(sessionUser)
    expect(session.expires).toBe("2026-08-01T00:00:00Z")
  })

  it("never leaks the Smarkets token or refresh token — by key or by value", () => {
    const session = buildClientSession(
      { user: undefined, expires: "2026-08-01T00:00:00Z" },
      sessionUser,
    )
    const serialized = JSON.stringify(session)

    expect(session.user).not.toHaveProperty("smkToken")
    expect(session.user).not.toHaveProperty("smkRefreshToken")
    expect(serialized).not.toContain("smkToken")
    expect(serialized).not.toContain(authorizedUser.smkToken)
    expect(serialized).not.toContain(authorizedUser.smkRefreshToken)
  })
})

describe("invalidateUpstreamSession", () => {
  it("resolves without throwing on a successful upstream logout", async () => {
    await expect(
      invalidateUpstreamSession("mock-session-token"),
    ).resolves.toBeUndefined()
  })

  it("swallows an upstream failure so the local sign-out can proceed", async () => {
    server.use(logoutFailureHandler)

    await expect(
      invalidateUpstreamSession("mock-session-token"),
    ).resolves.toBeUndefined()
  })
})
