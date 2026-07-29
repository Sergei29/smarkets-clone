import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import ContractRow from "./ContractRow"
import type { FeaturedMarket } from "@/types"

type Props = { market: FeaturedMarket }

/** One market's name plus its ordered contracts — used by the event page's broader market list. */
const MarketCard = ({ market }: Props) => (
  <Card>
    <CardHeader>
      <CardTitle>{market.name}</CardTitle>
    </CardHeader>
    <CardContent>
      <ul
        className="flex flex-col gap-1"
        aria-label={`${market.name} contracts`}
      >
        {market.contracts.map((contract) => (
          <li key={contract.id}>
            <ContractRow contract={contract} />
          </li>
        ))}
      </ul>
    </CardContent>
  </Card>
)

export default MarketCard
