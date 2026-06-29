import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithDiagnosis } from "@/context/diagnosis-test-utils";
import MyPagePage from "./page";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

describe("MyPagePage", () => {
  it("shows the email's local part as the display name", () => {
    renderWithDiagnosis(<MyPagePage />);

    expect(screen.getByText("user")).toBeInTheDocument();
  });

  it("shows the header stats and recent trend", () => {
    renderWithDiagnosis(<MyPagePage />);

    expect(screen.getByText("5회")).toBeInTheDocument();
    expect(screen.getByText("2.51t")).toBeInTheDocument();
    expect(screen.getAllByText("개선 중").length).toBeGreaterThan(0);
  });

  it("shows the report history by default, with the latest entry tagged", () => {
    renderWithDiagnosis(<MyPagePage />);

    expect(screen.getByText("2025년 5월")).toBeInTheDocument();
    expect(screen.getByText("2025년 1월")).toBeInTheDocument();
    expect(screen.getByText("가장 최근 진단")).toBeInTheDocument();
  });

  it("switches to the settings tab and shows the menu items", async () => {
    const user = userEvent.setup();
    renderWithDiagnosis(<MyPagePage />);

    await user.click(screen.getByRole("button", { name: "설정" }));

    expect(screen.getByText("알림 설정")).toBeInTheDocument();
    expect(screen.getByText("개인정보 처리방침")).toBeInTheDocument();
    expect(screen.getByText("이용약관")).toBeInTheDocument();
    expect(screen.getByText("1.0.0")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "로그아웃" }),
    ).toBeInTheDocument();
  });

  it("links settings items to their respective sub-pages", async () => {
    const user = userEvent.setup();
    renderWithDiagnosis(<MyPagePage />);

    await user.click(screen.getByRole("button", { name: "설정" }));

    expect(screen.getByRole("link", { name: "알림 설정" })).toHaveAttribute(
      "href",
      "/mypage/notifications",
    );
    expect(
      screen.getByRole("link", { name: "개인정보 처리방침" }),
    ).toHaveAttribute("href", "/mypage/privacy");
    expect(screen.getByRole("link", { name: "이용약관" })).toHaveAttribute(
      "href",
      "/mypage/terms",
    );
  });

  it("navigates to /login when logging out", async () => {
    const user = userEvent.setup();
    renderWithDiagnosis(<MyPagePage />);

    await user.click(screen.getByRole("button", { name: "설정" }));
    await user.click(screen.getByRole("button", { name: "로그아웃" }));

    expect(push).toHaveBeenCalledWith("/login");
  });
});
