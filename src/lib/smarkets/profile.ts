import "server-only"

import { smarketsFetch } from "./smarketsClient"
import { profileSchema } from "./schemas"
import { SmarketsError } from "./errors"
import type { SmarketsProfile, SmarketsSessionUser } from "@/types"

/**
 * Fetch the current user's profile. Called by `authorize()` after login to
 * populate the safe, client-visible session fields.
 */
export const getSmarketsProfile = (token: string): Promise<SmarketsProfile> =>
  smarketsFetch("/v0/users/current/info-without-rate/", {
    method: "GET",
    token,
    schema: profileSchema,
  })

/**
 * Map the raw upstream profile onto the safe `SmarketsSessionUser`. The
 * identity fields (`id_slug`, `member_id`, `email`) are optional in the OpenAPI
 * contract but always present for an authenticated user; their absence means we
 * cannot build a session, so we surface a validation error rather than coerce.
 */
export const toSessionUser = (
  profile: SmarketsProfile,
): SmarketsSessionUser => {
  if (
    profile.id_slug === undefined ||
    profile.member_id === undefined ||
    profile.email === undefined
  ) {
    throw SmarketsError.validation(
      "Profile is missing required identity fields",
    )
  }

  return {
    id: profile.id_slug,
    memberId: profile.member_id,
    email: profile.email,
    givenName: profile.given_name ?? null,
    familyName: profile.family_name ?? null,
    currency: profile.currency ?? null,
    country: profile.country,
    betPermission: profile.bet_permission ?? false,
    permittedCountry: profile.permitted_country,
  }
}
