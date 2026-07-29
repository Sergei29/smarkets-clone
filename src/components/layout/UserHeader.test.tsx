import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import UserHeader from "./UserHeader"

const useSession = vi.fn()

vi.mock("next-auth/react", () => ({
  useSession: () => useSession(),
  signOut: vi.fn(),
}))

vi.mock("next-themes", () => ({
  useTheme: () => ({ resolvedTheme: "light", setTheme: vi.fn() }),
}))

describe("UserHeader", () => {
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

    render(<UserHeader />)
    expect(screen.getByText("Ada Lovelace")).toBeInTheDocument()
  })

  it("falls back to the email when given/family name are both absent", () => {
    useSession.mockReturnValue({
      data: {
        user: { givenName: null, familyName: null, email: "ada@example.com" },
      },
    })

    render(<UserHeader />)
    expect(screen.getByText("ada@example.com")).toBeInTheDocument()
  })

  it("renders no profile text when there is no session", () => {
    useSession.mockReturnValue({ data: null })

    render(<UserHeader />)
    expect(screen.queryByText(/@/)).not.toBeInTheDocument()
  })

  it("links the brand back to the homepage", () => {
    useSession.mockReturnValue({ data: null })

    render(<UserHeader />)
    expect(screen.getByRole("link", { name: "Smarkets" })).toHaveAttribute(
      "href",
      "/",
    )
  })
})
