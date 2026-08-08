import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { getHomepageViewModel } from "@/lib/homepage/getHomepageViewModel"
import { toSmarketsError } from "@/lib/smarkets/errors"
import EventCard from "@/components/homepage/EventCard"
import QuotesContextProvider from "@/providers/QuotesProvider"
import QuotesStatusProvider from "@/providers/QuotesStatusProvider"
import QuotesUpdatingIndicator from "@/components/markets/QuotesUpdatingIndicator"
import type { FeaturedEvent } from "@/types"

export const HomeFeedSkeleton = () => (
  <div role="status" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 pt-8">
    <span className="sr-only">Loading featured events…</span>
    {Array.from({ length: 6 }, (_, index) => (
      <Card key={index} aria-hidden="true">
        <CardHeader>
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-4 w-1/3" />
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-7.75 w-full" />
          <Skeleton className="h-7.75 w-full" />
          <Skeleton className="h-7.75 w-full" />
        </CardContent>
      </Card>
    ))}
  </div>
)

const HomeFeed = async () => {
  let events: FeaturedEvent[]

  try {
    events = await getHomepageViewModel()
  } catch (error) {
    const smarketsError = toSmarketsError(error)
    return (
      <Alert variant="destructive">
        <AlertTitle>Couldn&apos;t load events</AlertTitle>
        <AlertDescription>{smarketsError.message}</AlertDescription>
      </Alert>
    )
  }

  if (events.length === 0) {
    return (
      <p className="text-center text-muted-foreground">
        No events are available right now. Check back soon.
      </p>
    )
  }

  /**
   * Purpose:
   * - Extract market IDs
   * - Remove the gaps (undefined) from the array,
   * - Deduplicate by [...new Set(...)]
   */
  const marketIds = Array.from(
    new Set(
      events
        .map((event) => event.market?.id)
        .filter((id): id is string => id !== undefined),
    ),
  )

  return (
    <QuotesContextProvider marketIds={marketIds}>
      <div className="mb-2 flex justify-end min-h-6.25">
        <QuotesStatusProvider marketIds={marketIds}>
          <QuotesUpdatingIndicator />
        </QuotesStatusProvider>
      </div>
      <ul
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        aria-label="Upcoming and live events list"
      >
        {events.map((event) => (
          <li
            key={event.id}
            aria-label={event.name}
            className="grid row-span-2"
          >
            <EventCard event={event} />
          </li>
        ))}
      </ul>
    </QuotesContextProvider>
  )
}

export default HomeFeed
