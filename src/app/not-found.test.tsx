import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import NotFound from "./not-found";

describe("NotFound", () => {
  it("shows the GreenCheck wordmark, the 404 message and a way back home", () => {
    render(<NotFound />);

    expect(screen.getByText("GreenCheck")).toBeInTheDocument();
    expect(screen.getByText("404")).toBeInTheDocument();
    expect(screen.getByText("페이지를 찾을 수 없어요")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "홈으로 돌아가기" }),
    ).toHaveAttribute("href", "/");
  });
});
