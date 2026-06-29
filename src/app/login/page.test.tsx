import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { renderWithDiagnosis as render } from "@/context/diagnosis-test-utils";
import LoginPage from "./page";

function getSubmitButton(container: HTMLElement) {
  const button = container.querySelector('button[type="submit"]');
  if (!button) {
    throw new Error("submit button not found");
  }
  return button as HTMLButtonElement;
}

describe("LoginPage", () => {
  it("renders the login form by default", () => {
    const { container } = render(<LoginPage />);

    expect(screen.getByRole("heading", { name: "로그인" })).toBeInTheDocument();
    expect(getSubmitButton(container)).toHaveTextContent("로그인");
  });

  it("switches to the signup form when the toggle is clicked", async () => {
    const user = userEvent.setup();
    const { container } = render(<LoginPage />);

    await user.click(screen.getByRole("button", { name: "회원가입" }));

    expect(
      screen.getByRole("heading", { name: "회원가입" }),
    ).toBeInTheDocument();
    expect(getSubmitButton(container)).toHaveTextContent("회원가입");
  });

  it("shows an inline coming-soon message when the login form is submitted", async () => {
    const user = userEvent.setup();
    const { container } = render(<LoginPage />);

    await user.type(screen.getByLabelText("이메일"), "test@example.com");
    await user.type(screen.getByLabelText("비밀번호"), "password123");
    await user.click(getSubmitButton(container));

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
});
