import { describe, expect, it } from "vitest"
import { selectFeaturedEvents } from "./selectFeaturedEvents"
import type { SmarketsEvent } from "@/types"

const baseEvent: SmarketsEvent = {
  id: "1",
  name: "Event",
  short_name: null,
  full_slug: "/event",
  state: "live",
  type: "football_match",
  start_datetime: null,
  display_order: null,
  bettable: true,
  hidden: false,
}

const event = (overrides: Partial<SmarketsEvent>): SmarketsEvent => ({
  ...baseEvent,
  ...overrides,
})

describe("selectFeaturedEvents", () => {
  it("keeps only live/upcoming, bettable, non-hidden events", () => {
    const events = [
      event({ id: "1", state: "live" }),
      event({ id: "2", state: "ended" }),
      event({ id: "3", state: "upcoming", bettable: false }),
      event({ id: "4", state: "upcoming", hidden: true }),
      event({ id: "5", state: "upcoming" }),
    ]

    const selected = selectFeaturedEvents(events)

    expect(selected.map((e) => e.id)).toEqual(["1", "5"])
  })

  it("treats a missing bettable field as bettable (only false excludes)", () => {
    const events = [event({ id: "1", bettable: undefined })]
    expect(selectFeaturedEvents(events).map((e) => e.id)).toEqual(["1"])
  })

  it("orders by display_order then numeric id", () => {
    const events = [
      event({ id: "1", display_order: 2 }),
      event({ id: "2", display_order: 1 }),
      event({ id: "3", display_order: null }),
    ]

    expect(selectFeaturedEvents(events).map((e) => e.id)).toEqual([
      "2",
      "1",
      "3",
    ])
  })

  it("caps to the given limit", () => {
    const events = Array.from({ length: 10 }, (_, index) =>
      event({ id: String(index + 1), display_order: index }),
    )

    expect(selectFeaturedEvents(events, 3).map((e) => e.id)).toEqual([
      "1",
      "2",
      "3",
    ])
  })
})
