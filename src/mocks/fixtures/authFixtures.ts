/**
 * Sanitised auth fixtures for MSW. Shapes mirror the HAR-confirmed login
 * contract and the verified `/v0/users/current/info-without-rate/` profile
 * response (see README "API contract verification"). No real credentials or
 * PII — all values below are fictional test data.
 */

export const validCredentials = {
  username: "test.user@example.com",
  password: "correct-horse-battery-staple",
}

export const mfaCredentials = {
  username: "mfa.user@example.com",
  password: "correct-horse-battery-staple",
}

/** POST /v3/sessions/ — 201 success body (factor: "complete"). */
export const sessionSuccessFixture = {
  created_social_member: false,
  factor: "complete",
  refresh_token: "mock-refresh-token",
  token: "mock-session-token",
  stop: "2026-07-29T00:00:00Z",
  verify: false,
}

/** POST /v3/sessions/ — 201 body when the account requires an unsupported MFA factor. */
export const sessionMfaRequiredFixture = {
  created_social_member: false,
  factor: "totp",
  refresh_token: "mock-refresh-token",
  token: "mock-session-token",
  stop: "2026-07-29T00:00:00Z",
  verify: false,
}

/** GET /v0/users/current/info-without-rate/ — 200 success body. */
export const profileFixture = {
  authenticated: true,
  id_slug: "test-user",
  member_id: 123456,
  email: "test.user@example.com",
  given_name: "Test",
  family_name: "User",
  country: "GB",
  currency: "GBP",
  bet_permission: true,
  permitted_country: true,
  api_user: false,
  deposit_limits_required: false,
  has_national_id: null,
  national_id: null,
  last_changed_terms: "2026-01-01T00:00:00Z",
  last_seen_terms: "2026-01-01T00:00:00Z",
}

/** DELETE /v0/sessions/current/ — 200 success body. */
export const logoutSuccessFixture = { success: true }
