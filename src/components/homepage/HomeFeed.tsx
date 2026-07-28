import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { getHomepageViewModel } from "@/lib/homepage/getHomepageViewModel"
import { toSmarketsError } from "@/lib/smarkets/errors"
import EventCard from "@/components/homepage/EventCard"
import LiveMarketPrices, {
  QuotesUpdatingIndicator,
} from "@/components/markets/LiveMarketPrices"
import type { FeaturedEvent } from "@/types"

export const HomeFeedSkeleton = () => (
  <div role="status" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
    <span className="sr-only">Loading featured events…</span>
    {Array.from({ length: 6 }, (_, index) => (
      <Card key={index} aria-hidden="true">
        <CardHeader>
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-4 w-1/3" />
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-6 w-full" />
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

  const marketIds = Array.from(
    new Set(
      events
        .map((event) => event.market?.id)
        .filter((id): id is string => id !== undefined),
    ),
  )

  return (
    <LiveMarketPrices marketIds={marketIds}>
      <div className="mb-2 flex justify-end">
        <QuotesUpdatingIndicator />
      </div>
      <ul
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        aria-label="Upcoming and live events list"
      >
        {events.map((event) => (
          <li key={event.id} aria-label={event.name}>
            <EventCard event={event} />
          </li>
        ))}
      </ul>
    </LiveMarketPrices>
  )
}

export default HomeFeed
