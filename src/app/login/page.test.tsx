import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import LoginPage from "./page";

describe("LoginPage", () => {
  it("renders the login form by default", () => {
    render(<LoginPage />);

    expect(screen.getByRole("heading", { name: "로그인" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "로그인 →" }),
    ).toBeInTheDocument();
  });

  it("switches to the signup form when the toggle is clicked", async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.click(screen.getByRole("button", { name: "회원가입" }));

    expect(
      screen.getByRole("heading", { name: "회원가입" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "회원가입 →" }),
    ).toBeInTheDocument();
  });

  it("shows an inline coming-soon message when the login form is submitted", async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.type(screen.getByLabelText("이메일"), "test@example.com");
    await user.type(screen.getByLabelText("비밀번호"), "password123");
    await user.click(screen.getByRole("button", { name: "로그인 →" }));

    expect(screen.getByText("로그인 기능은 준비 중이에요")).toBeInTheDocument();
  });

  it("shows an inline coming-soon message for social login buttons", async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.click(screen.getByRole("button", { name: /카카오로 계속하기/ }));
    expect(
      screen.getByText("카카오 로그인 기능은 준비 중이에요"),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Google로 계속하기/ }));
    expect(
      screen.getByText("Google 로그인 기능은 준비 중이에요"),
    ).toBeInTheDocument();
  });

  it("links the skip CTA back to home", () => {
    render(<LoginPage />);

    expect(screen.getByRole("link", { name: "나중에 하기 →" })).toHaveAttribute(
      "href",
      "/",
    );
  });
});
