import { describe, expect, it } from "vitest"
import { SmarketsError, isSmarketsError, toSmarketsError } from "./errors"

describe("SmarketsError.fromUpstream", () => {
  it("maps known upstream statuses to controlled client-facing codes", () => {
    expect(SmarketsError.fromUpstream(400).code).toBe("bad_request")
    expect(SmarketsError.fromUpstream(401).code).toBe("unauthorized")
    expect(SmarketsError.fromUpstream(403).code).toBe("forbidden")
    expect(SmarketsError.fromUpstream(429).code).toBe("rate_limited")
  })

  it("maps unknown upstream statuses to a generic upstream_error", () => {
    const error = SmarketsError.fromUpstream(503)
    expect(error.code).toBe("upstream_error")
    expect(error.upstreamStatus).toBe(503)
  })

  it("carries a client-facing HTTP status distinct from the upstream status", () => {
    const error = SmarketsError.fromUpstream(429)
    expect(error.status).toBe(429)
    expect(error.upstreamStatus).toBe(429)
  })
})

describe("toClientJson", () => {
  it("exposes only the error code and message, never upstream detail", () => {
    const error = SmarketsError.fromUpstream(401, "invalid session")
    expect(error.toClientJson()).toEqual({
      error: "unauthorized",
      message: "invalid session",
    })
  })
})

describe("isSmarketsError / toSmarketsError", () => {
  it("recognizes an existing SmarketsError", () => {
    const error = SmarketsError.badRequest()
    expect(isSmarketsError(error)).toBe(true)
    expect(toSmarketsError(error)).toBe(error)
  })

  it("coerces an arbitrary thrown value into a client-safe upstream_error", () => {
    const coerced = toSmarketsError(new Error("boom"))
    expect(isSmarketsError(coerced)).toBe(true)
    expect(coerced.code).toBe("upstream_error")
    expect(coerced.status).toBe(502)
  })

  it("coerces a non-Error throw (e.g. a string) without crashing", () => {
    const coerced = toSmarketsError("unexpected string throw")
    expect(coerced.code).toBe("upstream_error")
  })
})
