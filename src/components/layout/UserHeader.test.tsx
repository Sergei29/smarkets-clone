import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import UserHeader from "./UserHeader"

vi.mock("next-auth/react", () => ({ signOut: vi.fn() }))

vi.mock("next-themes", () => ({
  useTheme: () => ({ resolvedTheme: "light", setTheme: vi.fn() }),
}))

describe("UserHeader", () => {
  it("links the brand back to the homepage", () => {
    render(<UserHeader />)
    expect(screen.getByRole("link", { name: "Smarkets" })).toHaveAttribute(
      "href",
      "/",
    )
  })

  it("renders the theme toggle and sign-out control without needing a session", () => {
    render(<UserHeader />)
    expect(
      screen.getByRole("button", { name: /toggle theme/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: /sign out/i }),
    ).toBeInTheDocument()
  })

  it("renders the profile slot passed as children", () => {
    render(
      <UserHeader>
        <span>Ada Lovelace</span>
      </UserHeader>,
    )
    expect(screen.getByText("Ada Lovelace")).toBeInTheDocument()
  })
})
