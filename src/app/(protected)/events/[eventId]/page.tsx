import type { Metadata } from "next"
import type { PageProps } from "@/types"

export const metadata: Metadata = {}

const EventPage = async ({
  params,
  searchParams,
}: PageProps<{ eventId: string }>) => {
  return (
    <>
      <h1 className="text-3xl font-bold underline text-center">
        Event details page
      </h1>
    </>
  )
}

export default EventPage
