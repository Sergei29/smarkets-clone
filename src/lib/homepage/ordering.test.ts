import { describe, expect, it } from "vitest"
import { compareByDisplayOrder } from "./ordering"

type Orderable = { id: string; display_order: number | null }

const item = (id: string, display_order: number | null): Orderable => ({
  id,
  display_order,
})

describe("compareByDisplayOrder", () => {
  it("orders ascending by display_order", () => {
    const a = item("1", 2)
    const b = item("2", 1)
    expect(compareByDisplayOrder(a, b)).toBeGreaterThan(0)
    expect(compareByDisplayOrder(b, a)).toBeLessThan(0)
  })

  it("sorts null display_order last regardless of comparison direction", () => {
    const withOrder = item("1", 1)
    const withoutOrder = item("2", null)
    expect(compareByDisplayOrder(withoutOrder, withOrder)).toBeGreaterThan(0)
    expect(compareByDisplayOrder(withOrder, withoutOrder)).toBeLessThan(0)
  })

  it("falls back to numeric id when display_order ties", () => {
    const a = item("10", 1)
    const b = item("2", 1)
    expect(compareByDisplayOrder(a, b)).toBeGreaterThan(0)
  })

  it("treats two null display_orders as equal, deferring to id", () => {
    const a = item("1", null)
    const b = item("2", null)
    expect(compareByDisplayOrder(a, b)).toBeLessThan(0)
  })

  it("produces a stable overall sort", () => {
    const items = [item("5", null), item("2", 1), item("3", 1), item("1", 0)]
    const sorted = [...items].sort(compareByDisplayOrder)
    expect(sorted.map((entry) => entry.id)).toEqual(["1", "2", "3", "5"])
  })
})
