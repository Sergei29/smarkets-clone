import { vi } from "vitest"

/**
 * Advance Vitest's fake clock in small steps rather than one large jump.
 *
 * TanStack Query notifies its React subscriber via a fresh `setTimeout(fn, 0)`
 * scheduled at the moment a polled fetch resolves (see
 * `@tanstack/query-core`'s `notifyManager`/`systemSetTimeoutZero`). When that
 * moment falls exactly on the boundary of one big
 * `vi.advanceTimersByTimeAsync(interval)` call, the trailing notification
 * timer never gets a turn within that same call — the query cache updates,
 * but the component's DOM silently stays one tick behind it. Stepping past
 * the target time in smaller increments, with a buffer past it, gives that
 * notification room to fire before the caller asserts on the DOM.
 */
export const advanceFakeTimers = async (
  totalMs: number,
  { stepMs = 250, bufferMs = 500 }: { stepMs?: number; bufferMs?: number } = {},
): Promise<void> => {
  if (totalMs === 0) {
    await vi.advanceTimersByTimeAsync(0)
    return
  }
  let remaining = totalMs + bufferMs
  while (remaining > 0) {
    const step = Math.min(stepMs, remaining)
    await vi.advanceTimersByTimeAsync(step)
    remaining -= step
  }
}
