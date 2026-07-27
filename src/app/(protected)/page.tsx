import type { Metadata } from "next"

export const metadata: Metadata = {}

const HomePage = async () => {
  return (
    <>
      <h1 className="text-3xl font-bold underline text-center my-4">
        Home page
      </h1>
      <p className="text-center">
        Homepage: Users should see a homepage with various events and markets
        featured. The markets displayed should have contracts with prices that
        update regularly.
      </p>
      <p className="text-center">
        Events: Users can click on a specific event to see more details and more
        available markets.
      </p>
    </>
  )
}

export default HomePage
