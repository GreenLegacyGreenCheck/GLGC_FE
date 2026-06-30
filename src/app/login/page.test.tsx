import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithAuth } from "@/context/auth-test-utils";
import LoginPage from "./page";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

const login = vi.fn();
const signup = vi.fn();

vi.mock("@/lib/auth-api", () => ({
  login: (...args: unknown[]) => login(...args),
  signup: (...args: unknown[]) => signup(...args),
}));

function getSubmitButton(container: HTMLElement) {
  const button = container.querySelector('button[type="submit"]');
  if (!button) {
    throw new Error("submit button not found");
  }
  return button as HTMLButtonElement;
}

describe("LoginPage", () => {
  it("renders the login form by default", () => {
    const { container } = renderWithAuth(<LoginPage />);

    expect(screen.getByRole("heading", { name: "로그인" })).toBeInTheDocument();
    expect(getSubmitButton(container)).toHaveTextContent("로그인");
  });

  it("switches to the signup form when the toggle is clicked", async () => {
    const user = userEvent.setup();
    const { container } = renderWithAuth(<LoginPage />);

    await user.click(screen.getByRole("button", { name: "회원가입" }));

    expect(
      screen.getByRole("heading", { name: "회원가입" }),
    ).toBeInTheDocument();
    expect(getSubmitButton(container)).toHaveTextContent("회원가입");
  });

  it("logs in and redirects to /mypage on success", async () => {
    login.mockResolvedValue({
      token: "jwt-token",
      user: { id: "user-1", email: "test@example.com" },
    });
    const user = userEvent.setup();
    const { container } = renderWithAuth(<LoginPage />);

    await user.type(screen.getByLabelText("이메일"), "test@example.com");
    await user.type(screen.getByLabelText("비밀번호"), "password1234");
    await user.click(getSubmitButton(container));

    expect(login).toHaveBeenCalledWith({
      email: "test@example.com",
      password: "password1234",
    });
    await vi.waitFor(() => expect(push).toHaveBeenCalledWith("/mypage"));
  });

  it("shows an error message when login fails", async () => {
    login.mockRejectedValue(
      new Error("이메일 또는 비밀번호가 올바르지 않습니다."),
    );
    const user = userEvent.setup();
    const { container } = renderWithAuth(<LoginPage />);

    await user.type(screen.getByLabelText("이메일"), "test@example.com");
    await user.type(screen.getByLabelText("비밀번호"), "wrong-password");
    await user.click(getSubmitButton(container));

    expect(
      await screen.findByText("이메일 또는 비밀번호가 올바르지 않습니다."),
    ).toBeInTheDocument();
  });

  it("disables the social login buttons when OAuth env vars are not set", () => {
    renderWithAuth(<LoginPage />);

    expect(
      screen.getByRole("button", { name: /카카오로 계속하기/ }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: /Google로 계속하기/ }),
    ).toBeDisabled();
  });
});
