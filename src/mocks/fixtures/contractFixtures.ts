import type { SmarketsContract } from "@/types"
import {
  matchOddsMarket,
  totalGoalsMarket,
  raceWinnerMarket,
} from "./marketFixtures"

/** Contracts keyed to the market fixtures. Semantics are in `contract_type.name`. */

export const contractFixtures: SmarketsContract[] = [
  {
    id: "3001",
    market_id: matchOddsMarket.id,
    name: "Arsenal",
    slug: "arsenal",
    contract_type: { name: "team" },
    display_order: 1,
  },
  {
    id: "3002",
    market_id: matchOddsMarket.id,
    name: "Draw",
    slug: "draw",
    contract_type: { name: "draw" },
    display_order: 2,
  },
  {
    id: "3003",
    market_id: matchOddsMarket.id,
    name: "Chelsea",
    slug: "chelsea",
    contract_type: { name: "team" },
    display_order: 3,
  },
  {
    id: "3004",
    market_id: totalGoalsMarket.id,
    name: "Over 2.5",
    slug: "over-2-5",
    contract_type: { name: "over" },
    display_order: 1,
  },
  {
    id: "3005",
    market_id: totalGoalsMarket.id,
    name: "Under 2.5",
    slug: "under-2-5",
    contract_type: { name: "under" },
    display_order: 2,
  },
  {
    id: "3006",
    market_id: raceWinnerMarket.id,
    name: "Thunderbolt",
    slug: "thunderbolt",
    contract_type: { name: "competitor" },
    display_order: 1,
  },
  {
    id: "3007",
    market_id: raceWinnerMarket.id,
    name: "Silver Arrow",
    slug: "silver-arrow",
    contract_type: { name: "competitor" },
    display_order: 2,
  },
]

export const contractsResponseFixture = { contracts: contractFixtures }
