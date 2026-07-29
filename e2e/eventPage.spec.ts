import { test, expect } from "@playwright/test"
import {
  quoteFixtures,
  quoteFixturesUpdated,
} from "../src/mocks/fixtures/quoteFixtures"

test("event page displays more markets than its homepage card", async ({
  page,
}) => {
  await page.goto("/")

  const arsenalCard = page.getByRole("listitem", { name: "Arsenal vs Chelsea" })
  await expect(arsenalCard.getByText("Match Odds")).toBeVisible()
  await expect(arsenalCard.getByText("Over/Under 2.5 Goals")).toHaveCount(0)

  await page.goto("/events/1001")

  // Scoped to direct children only — `getByRole("listitem")` would otherwise
  // also match each market card's own nested contract `<li>`s.
  const marketItems = page.locator(
    '[aria-label="Arsenal vs Chelsea markets"] > li',
  )
  await expect(marketItems).toHaveCount(2)
  await expect(marketItems.getByText("Match Odds")).toBeVisible()
  await expect(marketItems.getByText("Over/Under 2.5 Goals")).toBeVisible()
})

test("a displayed contract price changes after a polling interval", async ({
  page,
}) => {
  let callCount = 0
  await page.route("**/api/smarkets/quotes**", async (route) => {
    callCount += 1
    await route.fulfill({
      json: callCount === 1 ? quoteFixtures : quoteFixturesUpdated,
    })
  })

  await page.goto("/events/1001")

  await expect(page.getByLabel("Arsenal bid")).toHaveText("B 2.02")
  await expect(page.getByLabel("Arsenal bid")).toHaveText("B 1.98", {
    timeout: 8_000,
  })
})
