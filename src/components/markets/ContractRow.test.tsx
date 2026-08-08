import { afterEach, describe, expect, it, vi } from "vitest"
import { screen, waitFor } from "@testing-library/react"
import { renderWithProviders } from "@/test/renderWithProviders"
import { advanceFakeTimers } from "@/test/advanceFakeTimers"
import QuotesProvider from "@/providers/QuotesProvider"
import { server } from "@/mocks/server"
import {
  createSequentialInternalQuotesHandler,
  internalQuotesRateLimitedHandler,
  internalQuotesUnavailableHandler,
} from "@/mocks/handlers/internalApiHandlers"
import ContractRow from "./ContractRow"

const QUOTES_QUERY_KEY = ["quotes", ["2001"]]
const QUOTES_POLL_INTERVAL_MS = 5_000

const renderContractRow = (contractId: string, contractName: string) =>
  renderWithProviders(
    <QuotesProvider marketIds={["2001"]}>
      <ContractRow contract={{ id: contractId, name: contractName }} />
    </QuotesProvider>,
  )

afterEach(() => {
  vi.useRealTimers()
})

describe("ContractRow", () => {
  it("shows an em dash for bid/offer before the first quote resolves", () => {
    renderContractRow("3001", "Arsenal")

    expect(screen.getByLabelText("Arsenal bid")).toHaveTextContent("B —")
    expect(screen.getByLabelText("Arsenal offer")).toHaveTextContent("O —")
  })

  it("shows the best bid/offer as decimal odds once the first quote resolves", async () => {
    renderContractRow("3001", "Arsenal")

    await waitFor(() =>
      expect(screen.getByLabelText("Arsenal bid")).toHaveTextContent("B 2.02"),
    )
    expect(screen.getByLabelText("Arsenal offer")).toHaveTextContent("O 1.98")
  })

  it("falls back to an em dash when the fetched quotes have no entry for this contract", async () => {
    const { queryClient } = renderContractRow("9999", "Mystery Contract")

    await waitFor(() =>
      expect(queryClient.getQueryState(QUOTES_QUERY_KEY)?.status).toBe(
        "success",
      ),
    )

    expect(screen.getByLabelText("Mystery Contract bid")).toHaveTextContent(
      "B —",
    )
    expect(screen.getByLabelText("Mystery Contract offer")).toHaveTextContent(
      "O —",
    )
  })

  it("updates prices after the polling interval", async () => {
    server.use(createSequentialInternalQuotesHandler())
    vi.useFakeTimers()

    renderContractRow("3001", "Arsenal")

    await advanceFakeTimers(0)
    expect(screen.getByLabelText("Arsenal bid")).toHaveTextContent("B 2.02")

    await advanceFakeTimers(QUOTES_POLL_INTERVAL_MS)
    expect(screen.getByLabelText("Arsenal bid")).toHaveTextContent("B 1.98")
    expect(screen.getByLabelText("Arsenal offer")).toHaveTextContent("O 1.94")
  })

  it("retains the last successful prices when a refetch fails", async () => {
    vi.useFakeTimers()

    const { queryClient } = renderContractRow("3001", "Arsenal")

    await advanceFakeTimers(0)
    expect(screen.getByLabelText("Arsenal bid")).toHaveTextContent("B 2.02")

    server.use(internalQuotesUnavailableHandler)
    await advanceFakeTimers(QUOTES_POLL_INTERVAL_MS)

    expect(queryClient.getQueryState(QUOTES_QUERY_KEY)?.status).toBe("error")
    expect(screen.getByLabelText("Arsenal bid")).toHaveTextContent("B 2.02")
  })

  it("renders the em-dash fallback without crashing when quotes are rate-limited", async () => {
    server.use(internalQuotesRateLimitedHandler)
    const { queryClient } = renderContractRow("3001", "Arsenal")

    await waitFor(() =>
      expect(queryClient.getQueryState(QUOTES_QUERY_KEY)?.status).toBe("error"),
    )

    expect(screen.getByLabelText("Arsenal bid")).toHaveTextContent("B —")
    expect(screen.getByLabelText("Arsenal offer")).toHaveTextContent("O —")
  })
})
