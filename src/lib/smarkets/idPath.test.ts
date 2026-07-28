import { describe, expect, it } from "vitest"
import {
  buildIdPath,
  capIds,
  compareNumericStrings,
  normalizeIds,
  toIdPathSegment,
} from "./idPath"
import { isSmarketsError } from "./errors"

describe("compareNumericStrings", () => {
  it("orders numerically, not lexicographically", () => {
    expect(compareNumericStrings("2", "10")).toBeLessThan(0)
    expect(compareNumericStrings("10", "2")).toBeGreaterThan(0)
    expect(compareNumericStrings("7", "7")).toBe(0)
  })

  it("stays correct beyond MAX_SAFE_INTEGER", () => {
    const big = "9007199254740993" // MAX_SAFE_INTEGER + 2
    const bigger = "9007199254740994"
    expect(compareNumericStrings(big, bigger)).toBeLessThan(0)
  })
})

describe("normalizeIds", () => {
  it("dedupes and sorts numerically", () => {
    expect(normalizeIds(["3", "1", "2", "1"])).toEqual(["1", "2", "3"])
  })

  it("trims whitespace and coerces numbers", () => {
    expect(normalizeIds([" 5 ", 3])).toEqual(["3", "5"])
  })

  it("throws bad_request on an empty set", () => {
    expect(() => normalizeIds([])).toThrow()
    try {
      normalizeIds([])
    } catch (error) {
      expect(isSmarketsError(error)).toBe(true)
      if (isSmarketsError(error)) expect(error.code).toBe("bad_request")
    }
  })

  it("throws bad_request on a non-numeric id", () => {
    expect(() => normalizeIds(["abc"])).toThrow()
  })

  it("ignores blank entries", () => {
    expect(normalizeIds(["", " ", "1"])).toEqual(["1"])
  })
})

describe("capIds", () => {
  it("caps to at most max ids", () => {
    expect(capIds(["1", "2", "3"], 2)).toEqual(["1", "2"])
  })

  it("leaves a shorter list untouched", () => {
    expect(capIds(["1"], 5)).toEqual(["1"])
  })
})

describe("toIdPathSegment", () => {
  it("comma-joins ids", () => {
    expect(toIdPathSegment(["1", "2", "3"])).toBe("1,2,3")
  })
})

describe("buildIdPath", () => {
  it("normalizes, caps and serializes in one step", () => {
    expect(buildIdPath(["3", "1", "2", "1"], 2)).toBe("1,2")
  })

  it("throws on an empty input", () => {
    expect(() => buildIdPath([], 10)).toThrow()
  })
})
