import type { SmarketsEvent } from "@/types"
import { compareByDisplayOrder } from "./ordering"

/** TASK.md suggests a small homepage set — 6 to 10 events. */
export const HOMEPAGE_EVENT_LIMIT = 8

const FEATURABLE_EVENT_STATES = new Set(["live", "upcoming"])

/**
 * Deterministic homepage event selection: visible, bettable events in a
 * live/upcoming state, ordered by `display_order` then numeric id, capped to
 * `limit`. Pure and side-effect free — unit-testable without network access.
 */
export const selectFeaturedEvents = (
  events: ReadonlyArray<SmarketsEvent>,
  limit: number = HOMEPAGE_EVENT_LIMIT,
): SmarketsEvent[] =>
  events
    .filter(
      (event) =>
        event.bettable !== false &&
        !event.hidden &&
        FEATURABLE_EVENT_STATES.has(event.state),
    )
    .slice()
    .sort(compareByDisplayOrder)
    .slice(0, limit)
