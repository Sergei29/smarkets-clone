import Link from "next/link"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import ContractRow from "@/components/markets/ContractRow"
import type { FeaturedEvent } from "@/types"

const EVENT_STATE_LABEL: Record<string, string> = {
  live: "Live",
  upcoming: "Upcoming",
}

type Props = { event: FeaturedEvent }

const EventCard = ({ event }: Props) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center justify-between gap-2">
        <h2 className="contents">
          <Link href={`/events/${event.id}`} className="hover:underline">
            {event.name}
          </Link>
        </h2>
        <Badge variant={event.state === "live" ? "default" : "secondary"}>
          {EVENT_STATE_LABEL[event.state] ?? event.state}
        </Badge>
      </CardTitle>
      {event.startDatetime && (
        <CardDescription>
          <time dateTime={event.startDatetime}>
            {new Date(event.startDatetime).toLocaleString()}
          </time>
        </CardDescription>
      )}
    </CardHeader>
    <CardContent>
      {event.market ? (
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-medium">{event.market.name}</h3>
          <ul
            className="flex flex-col gap-1"
            aria-label={`${event.market.name} contracts`}
          >
            {event.market.contracts.map((contract) => (
              <li key={contract.id}>
                <ContractRow contract={contract} />
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          No market available yet.
        </p>
      )}
    </CardContent>
  </Card>
)

export default EventCard
