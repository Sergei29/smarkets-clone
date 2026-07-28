import { compareNumericStrings } from "@/lib/smarkets/idPath"

/**
 * Shared display ordering for events/markets/contracts: `display_order`
 * ascending (nulls sort last, since upstream uses null for "unordered"), then
 * numeric id as a stable, deterministic tiebreak.
 */
export const compareByDisplayOrder = <
  T extends { id: string; display_order: number | null },
>(
  a: T,
  b: T,
): number => {
  if (a.display_order !== b.display_order) {
    if (a.display_order === null) return 1
    if (b.display_order === null) return -1
    return a.display_order - b.display_order
  }
  return compareNumericStrings(a.id, b.id)
}
