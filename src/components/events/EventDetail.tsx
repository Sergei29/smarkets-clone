import { notFound } from "next/navigation"
import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { getEventViewModel } from "@/lib/event/getEventViewModel"
import { toSmarketsError } from "@/lib/smarkets/errors"
import MarketCard from "@/components/markets/MarketCard"
import LiveMarketPricesProvider from "@/providers/LiveMarketPricesProvider"
import QuotesUpdatingIndicator from "@/components/markets/QuotesUpdatingIndicator"
import type { EventDetails } from "@/types"

const EVENT_STATE_LABEL: Record<string, string> = {
  live: "Live",
  upcoming: "Upcoming",
}

export const EventDetailSkeleton = () => (
  <div role="status" className="flex flex-col gap-4">
    <span className="sr-only">Loading event…</span>
    <Skeleton className="h-8 w-2/3" />
    <div className="grid gap-4 sm:grid-cols-2">
      {Array.from({ length: 4 }, (_, index) => (
        <Card key={index} aria-hidden="true">
          <CardHeader>
            <Skeleton className="h-5 w-1/2" />
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
)

type Props = { params: Promise<{ eventId: string }> }

/**
 * Event-page server flow (TASK.md): event + markets fetched concurrently,
 * contracts fetched for the displayable markets, quotes polled client-side —
 * see `getEventViewModel`. `params` is threaded through as a prop and awaited
 * here — inside the component this page wraps in `<Suspense>` — rather than
 * at the top of the page itself, per Cache Components' dynamic-params rule.
 */
const EventDetail = async ({ params }: Props) => {
  const { eventId } = await params

  let event: EventDetails | undefined
  try {
    event = await getEventViewModel(eventId)
  } catch (error) {
    const smarketsError = toSmarketsError(error)
    return (
      <Alert variant="destructive">
        <AlertTitle>Couldn&apos;t load this event</AlertTitle>
        <AlertDescription>{smarketsError.message}</AlertDescription>
      </Alert>
    )
  }

  if (!event) notFound()

  const marketIds = event.markets.map((market) => market.id)

  return (
    <LiveMarketPricesProvider marketIds={marketIds}>
      <header className="mb-4 flex items-start justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold">{event.name}</h1>
          {event.startDatetime && (
            <p className="text-sm text-muted-foreground">
              <time dateTime={event.startDatetime}>
                {new Date(event.startDatetime).toLocaleString()}
              </time>
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={event.state === "live" ? "default" : "secondary"}>
            {EVENT_STATE_LABEL[event.state] ?? event.state}
          </Badge>
          <QuotesUpdatingIndicator />
        </div>
      </header>

      {event.markets.length === 0 ? (
        <p className="text-center text-muted-foreground">
          No markets are available for this event right now.
        </p>
      ) : (
        <ul
          className="grid gap-4 sm:grid-cols-2"
          aria-label={`${event.name} markets`}
        >
          {event.markets.map((market) => (
            <li key={market.id}>
              <MarketCard market={market} />
            </li>
          ))}
        </ul>
      )}
    </LiveMarketPricesProvider>
  )
}

export default EventDetail
