import { z } from "zod"

/**
 * Zod schemas for the *consumed* subset of the Smarkets v3 API, derived from the
 * live OpenAPI 3.0.2 document (see README "API contract verification").
 *
 * Enum-like fields (`state`, `type`) are modelled as `string` rather than
 * `z.enum(...)` so that upstream adding a new value never fails validation at
 * the boundary. Known values are exported as constants for filtering logic.
 * Unknown object keys are stripped by default (Zod objects are non-strict), so
 * these schemas intentionally cover only the fields the UI uses.
 */

export const KNOWN_EVENT_STATES = [
  "new",
  "upcoming",
  "live",
  "ended",
  "settled",
  "cancelled",
] as const

export const KNOWN_MARKET_STATES = [
  "new",
  "open",
  "live",
  "halted",
  "settled",
  "voided",
] as const

// --- Events: GET /v3/events/ and /v3/events/{event_ids}/ ---

export const eventSchema = z.object({
  id: z.string(),
  name: z.string(),
  short_name: z.string().nullable(),
  full_slug: z.string(),
  state: z.string(),
  /** Sport/type slug, e.g. "football_match", "horse_racing_race". */
  type: z.string(),
  start_datetime: z.string().nullable(),
  display_order: z.number().int().nullable(),
  bettable: z.boolean().optional(),
  hidden: z.boolean(),
})

export const eventsResponseSchema = z.object({
  events: z.array(eventSchema),
})

// --- Markets: GET /v3/events/{event_ids}/markets/ ---

/** Market semantics live in `market_type.name`, not the display name/slug. */
export const marketTypeSchema = z.object({
  name: z.string(),
  param: z.string().optional(),
})

export const marketSchema = z.object({
  id: z.string(),
  name: z.string(),
  event_id: z.string(),
  slug: z.string(),
  market_type: marketTypeSchema.nullable(),
  state: z.string(),
  display_order: z.number().int().nullable(),
  hidden: z.boolean(),
})

export const marketsResponseSchema = z.object({
  markets: z.array(marketSchema),
})

// --- Contracts: GET /v3/markets/{market_ids}/contracts/ ---

/** Contract semantics live in `contract_type.name`, not the display name/slug. */
export const contractTypeSchema = z.object({
  name: z.string().nullish(),
  param: z.string().nullish(),
})

export const contractSchema = z.object({
  id: z.string(),
  market_id: z.string(),
  name: z.string(),
  slug: z.string(),
  contract_type: contractTypeSchema.nullable(),
  display_order: z.number().int().nullable(),
})

export const contractsResponseSchema = z.object({
  contracts: z.array(contractSchema),
})

// --- Quotes: GET /v3/markets/{market_ids}/quotes/ ---
// Response is an object keyed by contract ID → order book.
// `price` is in percentage basis points (e.g. 5000 → decimal odds 2.0).

export const priceLevelSchema = z.object({
  price: z.number().int(),
  quantity: z.number().int(),
})

export const quoteBookSchema = z.object({
  bids: z.array(priceLevelSchema),
  offers: z.array(priceLevelSchema),
})

export const quotesResponseSchema = z.record(z.string(), quoteBookSchema)

// --- Auth: POST /v3/sessions/ (login) ---
// HAR-confirmed body; success is 201. Only the fields we consume are modelled.
// `refresh_token` is present only for auth-v2 sessions, hence optional.

export const sessionResponseSchema = z.object({
  token: z.string(),
  factor: z.string(),
  refresh_token: z.string().optional(),
  stop: z.string().optional(),
  verify: z.boolean().optional(),
  created_social_member: z.boolean().optional(),
})

// --- Profile: GET /v0/users/current/info-without-rate/ ---
// Nullability mirrors the live spec: `country`/`permitted_country`/`authenticated`
// are required (country nullable); the rest are optional in the contract.

export const profileSchema = z.object({
  authenticated: z.boolean(),
  id_slug: z.string().optional(),
  member_id: z.number().int().optional(),
  email: z.string().optional(),
  given_name: z.string().nullish(),
  family_name: z.string().nullish(),
  country: z.string().nullable(),
  currency: z.string().nullish(),
  bet_permission: z.boolean().optional(),
  permitted_country: z.boolean(),
})
