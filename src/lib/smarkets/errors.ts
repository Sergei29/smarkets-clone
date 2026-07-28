/**
 * Structured, client-safe application errors for the Smarkets boundary.
 *
 * Every error carries a `status` = the HTTP status a Route Handler should return
 * to the browser, decoupled from the upstream status. Upstream bodies, tokens
 * and stack traces are never surfaced through `toClientJson()`.
 */

export type SmarketsErrorCode =
  | "bad_request"
  | "unauthorized"
  | "forbidden"
  | "rate_limited"
  | "timeout"
  | "network_error"
  | "validation_error"
  | "upstream_error"
  | "mfa_required"

/** Client-facing HTTP status for each error code. */
const CLIENT_STATUS: Record<SmarketsErrorCode, number> = {
  bad_request: 400,
  unauthorized: 401,
  forbidden: 403,
  rate_limited: 429,
  timeout: 504,
  network_error: 502,
  validation_error: 502,
  upstream_error: 502,
  mfa_required: 401,
}

type SmarketsErrorOptions = {
  upstreamStatus?: number
  cause?: unknown
}

export class SmarketsError extends Error {
  readonly code: SmarketsErrorCode
  /** HTTP status to surface to the browser. */
  readonly status: number
  /** The originating upstream status, when the error came from Smarkets. */
  readonly upstreamStatus?: number

  constructor(
    code: SmarketsErrorCode,
    message: string,
    options?: SmarketsErrorOptions,
  ) {
    super(
      message,
      options?.cause !== undefined ? { cause: options.cause } : undefined,
    )
    this.name = "SmarketsError"
    this.code = code
    this.status = CLIENT_STATUS[code]
    this.upstreamStatus = options?.upstreamStatus
  }

  /** Body safe to return from a Route Handler — no tokens, bodies or stacks. */
  toClientJson(): { error: SmarketsErrorCode; message: string } {
    return { error: this.code, message: this.message }
  }

  static badRequest(message = "Bad request"): SmarketsError {
    return new SmarketsError("bad_request", message)
  }

  static unauthorized(message = "Not authenticated"): SmarketsError {
    return new SmarketsError("unauthorized", message)
  }

  static mfaRequired(
    message = "Multi-factor authentication is not supported",
  ): SmarketsError {
    return new SmarketsError("mfa_required", message)
  }

  static timeout(message = "Upstream request timed out"): SmarketsError {
    return new SmarketsError("timeout", message)
  }

  static network(
    message = "Failed to reach the upstream service",
    cause?: unknown,
  ): SmarketsError {
    return new SmarketsError("network_error", message, { cause })
  }

  static validation(
    message = "Malformed upstream response",
    cause?: unknown,
  ): SmarketsError {
    return new SmarketsError("validation_error", message, { cause })
  }

  /** Map an upstream HTTP status onto a controlled client-facing error. */
  static fromUpstream(upstreamStatus: number, message?: string): SmarketsError {
    switch (upstreamStatus) {
      case 400:
        return new SmarketsError(
          "bad_request",
          message ?? "Upstream rejected the request",
          { upstreamStatus },
        )
      case 401:
        return new SmarketsError(
          "unauthorized",
          message ?? "Upstream session is invalid or expired",
          { upstreamStatus },
        )
      case 403:
        return new SmarketsError(
          "forbidden",
          message ?? "Upstream forbade the request",
          { upstreamStatus },
        )
      case 429:
        return new SmarketsError(
          "rate_limited",
          message ?? "Upstream rate limit exceeded",
          { upstreamStatus },
        )
      default:
        return new SmarketsError(
          "upstream_error",
          message ?? `Upstream error (${upstreamStatus})`,
          { upstreamStatus },
        )
    }
  }
}

export const isSmarketsError = (error: unknown): error is SmarketsError =>
  error instanceof SmarketsError

/** Coerce any thrown value into a client-safe SmarketsError. */
export const toSmarketsError = (error: unknown): SmarketsError => {
  if (isSmarketsError(error)) return error
  return new SmarketsError("upstream_error", "Unexpected error", {
    cause: error,
  })
}
