import { describe, expect, it } from "vitest"
import { shouldRetryQuery } from "./QueryProvider"

describe("shouldRetryQuery", () => {
  it.each([401, 403, 429])(
    "does not retry a %i error, regardless of failure count",
    (status) => {
      expect(shouldRetryQuery(0, { status })).toBe(false)
      expect(shouldRetryQuery(1, { status })).toBe(false)
    },
  )

  it("retries other statuses up to 2 times", () => {
    expect(shouldRetryQuery(0, { status: 500 })).toBe(true)
    expect(shouldRetryQuery(1, { status: 500 })).toBe(true)
    expect(shouldRetryQuery(2, { status: 500 })).toBe(false)
  })

  it("retries errors without a status up to 2 times", () => {
    expect(shouldRetryQuery(0, new Error("network down"))).toBe(true)
    expect(shouldRetryQuery(1, new Error("network down"))).toBe(true)
    expect(shouldRetryQuery(2, new Error("network down"))).toBe(false)
  })
})
