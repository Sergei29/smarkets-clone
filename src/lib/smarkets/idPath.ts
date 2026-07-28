import { SmarketsError } from "./errors"

/**
 * Helpers for batching resource IDs into Smarkets path segments.
 *
 * Path arrays use the OpenAPI default `simple` style — comma-joined in the path
 * (e.g. `/v3/markets/1,2,3/quotes/`). IDs are kept as strings throughout: real
 * Smarkets IDs can exceed `Number.MAX_SAFE_INTEGER`, so parsing them to `number`
 * would silently corrupt them.
 */

/** Upstream `maxItems` limits per endpoint (from the OpenAPI spec). */
export const ID_LIMITS = {
  events: 100,
  markets: 100,
  contracts: 100,
  quotes: 200,
} as const

const ID_PATTERN = /^\d+$/

/** Numeric-string comparator; safe beyond `MAX_SAFE_INTEGER`. Reused by homepage selection ordering. */
export const compareNumericStrings = (
  numericA: string,
  numericB: string,
): number => {
  if (numericA === numericB) return 0
  return BigInt(numericA) < BigInt(numericB) ? -1 : 1
}

/**
 * Validate, dedupe and stably sort a set of IDs. Sorting makes downstream cache
 * keys (e.g. the TanStack quotes query key) canonical for equivalent selections.
 * Throws `bad_request` on an empty set or any non-numeric ID.
 */
export const normalizeIds = (raw: ReadonlyArray<string | number>): string[] => {
  const ids = raw
    .map((value) => String(value).trim())
    .filter((value) => value.length > 0)
  if (ids.length === 0) {
    throw SmarketsError.badRequest("At least one id is required")
  }
  for (const id of ids) {
    if (!ID_PATTERN.test(id)) {
      throw SmarketsError.badRequest(`Invalid id: "${id}"`)
    }
  }
  return Array.from(new Set(ids)).sort(compareNumericStrings)
}

/** Cap to at most `max` IDs (respecting the upstream `maxItems` limit). */
export const capIds = (ids: ReadonlyArray<string>, max: number): string[] =>
  ids.slice(0, max)

/** Comma-joined `simple`-style path segment, e.g. `"1,2,3"`. */
export const toIdPathSegment = (ids: ReadonlyArray<string>): string =>
  ids.join(",")

/** Normalize → cap → serialize in one step. */
export const buildIdPath = (
  raw: ReadonlyArray<string | number>,
  max: number,
): string => toIdPathSegment(capIds(normalizeIds(raw), max))
