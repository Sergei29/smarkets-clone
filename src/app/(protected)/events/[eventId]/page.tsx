import type { Metadata } from "next"
import { Suspense } from "react"
import EventDetail, {
  EventDetailSkeleton,
} from "@/components/events/EventDetail"
import type { PageProps } from "@/types"

export const metadata: Metadata = {
  title: "Event — Smarkets",
}

/**
 * `params` is a promise; it's passed straight through to the
 * `<Suspense>`-wrapped `EventDetail` and awaited there rather than here, so
 * only that component is dynamic and the page shell can prerender (Cache
 * Components' `params`/`searchParams` rule).
 */
const EventPage = ({ params }: PageProps<{ eventId: string }>) => {
  return (
    <section className="mx-auto max-w-5xl p-4">
      <Suspense fallback={<EventDetailSkeleton />}>
        <EventDetail params={params} />
      </Suspense>
    </section>
  )
}

export default EventPage
