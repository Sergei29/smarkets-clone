import { http, HttpResponse } from "msw"
import { eventFixtures } from "../fixtures/eventFixtures"

const BASE = "https://api.smarkets.com"

const upstreamError = (
  error_type: string,
  status: number,
  data: unknown = {},
) => HttpResponse.json({ error_type, data }, { status })

/**
 * Default handlers filter the fixtures by requested IDs, so "event with no
 * markets" style emptiness for `/{event_ids}/` naturally falls out of
 * requesting an ID absent from the fixtures — no separate empty handler
 * needed for that case. `/v3/events/` (the unfiltered list) needs an explicit
 * override for the "no events" scenario since it takes no ID.
 */
export const upstreamEventHandlers = [
  http.get(`${BASE}/v3/events/`, () => {
    return HttpResponse.json({ events: eventFixtures }, { status: 200 })
  }),

  http.get(`${BASE}/v3/events/:eventIds/`, ({ params }) => {
    const ids = String(params.eventIds).split(",")
    const events = eventFixtures.filter((event) => ids.includes(event.id))
    return HttpResponse.json({ events }, { status: 200 })
  }),
]

/** Scenario: "no events" — the unfiltered listing comes back empty. */
export const emptyEventsHandler = http.get(`${BASE}/v3/events/`, () =>
  HttpResponse.json({ events: [] }, { status: 200 }),
)

/** Scenario: upstream events service unavailable. */
export const eventsUnavailableHandler = http.get(`${BASE}/v3/events/`, () =>
  upstreamError("EVENTS_UNAVAILABLE", 503),
)

/** Scenario: malformed upstream payload (fails schema validation). */
export const malformedEventsHandler = http.get(`${BASE}/v3/events/`, () =>
  HttpResponse.json({ events: [{ id: 123 }] }, { status: 200 }),
)
