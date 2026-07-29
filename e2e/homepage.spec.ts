import { test, expect } from "@playwright/test"

test("renders featured events, markets and contracts", async ({ page }) => {
  await page.goto("/")

  await expect(
    page.getByRole("heading", { name: "Featured events" }),
  ).toBeVisible()

  const arsenalCard = page.getByRole("listitem", { name: "Arsenal vs Chelsea" })
  await expect(
    arsenalCard.getByRole("link", { name: "Arsenal vs Chelsea" }),
  ).toBeVisible()
  await expect(arsenalCard.getByText("Match Odds")).toBeVisible()
  await expect(arsenalCard.getByText("Arsenal", { exact: true })).toBeVisible()
  await expect(arsenalCard.getByText("Draw", { exact: true })).toBeVisible()
  await expect(arsenalCard.getByText("Chelsea", { exact: true })).toBeVisible()
  await expect(arsenalCard.getByLabel("Arsenal bid")).toBeVisible()
  await expect(arsenalCard.getByLabel("Arsenal offer")).toBeVisible()

  const racingCard = page.getByRole("listitem", { name: "14:30 Ascot" })
  await expect(
    racingCard.getByRole("link", { name: "14:30 Ascot" }),
  ).toBeVisible()
  await expect(racingCard.getByText("Race Winner")).toBeVisible()
})

test("clicking an event opens its event page", async ({ page }) => {
  await page.goto("/")

  await page.getByRole("link", { name: "Arsenal vs Chelsea" }).click()

  await expect(page).toHaveURL("/events/1001")
  await expect(
    page.getByRole("heading", { name: "Arsenal vs Chelsea", level: 1 }),
  ).toBeVisible()
})
