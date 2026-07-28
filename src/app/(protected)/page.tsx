import type { Metadata } from "next"
import { Suspense } from "react"
import HomeFeed, { HomeFeedSkeleton } from "@/components/homepage/HomeFeed"

export const metadata: Metadata = {
  title: "Smarkets Home",
  description: "Live event odds and markets on Smarkets.",
}

const HomePage = () => {
  return (
    <section
      aria-labelledby="featured-events-heading"
      className="mx-auto max-w-5xl p-4"
    >
      <h1 id="featured-events-heading" className="mb-4 text-2xl font-semibold">
        Featured events
      </h1>
      <Suspense fallback={<HomeFeedSkeleton />}>
        <HomeFeed />
      </Suspense>
    </section>
  )
}

export default HomePage
