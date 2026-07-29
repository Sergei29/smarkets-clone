import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import UserDisplayName from "./UserDisplayName"

const useSession = vi.fn()

vi.mock("next-auth/react", () => ({
  useSession: () => useSession(),
}))

describe("UserDisplayName", () => {
  it("renders the given and family name when both are present", () => {
    useSession.mockReturnValue({
      data: {
        user: {
          givenName: "Ada",
          familyName: "Lovelace",
          email: "ada@example.com",
        },
      },
    })

    render(<UserDisplayName />)
    expect(screen.getByText("Ada Lovelace")).toBeInTheDocument()
  })

  it("falls back to the email when given/family name are both absent", () => {
    useSession.mockReturnValue({
      data: {
        user: { givenName: null, familyName: null, email: "ada@example.com" },
      },
    })

    render(<UserDisplayName />)
    expect(screen.getByText("ada@example.com")).toBeInTheDocument()
  })

  it("renders nothing when there is no session", () => {
    useSession.mockReturnValue({ data: null })

    const { container } = render(<UserDisplayName />)
    expect(container).toBeEmptyDOMElement()
  })
})
