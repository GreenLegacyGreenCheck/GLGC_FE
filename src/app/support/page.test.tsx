import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithDiagnosis } from "@/context/diagnosis-test-utils";
import type { DiagnosisResult } from "@/context/diagnosis-context";
import { DUMMY_SUPPORT_PROGRAMS } from "@/lib/support-programs";
import SupportPage from "./page";

const replace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
}));

const fakeResult: DiagnosisResult = {
  electricOcr: {
    rawText: "",
    confidence: 94.2,
    usageKwh: { value: 287, confidence: 94.2 },
    usageM3: { value: null, confidence: 0 },
    contractType: { value: "일반용", confidence: 94.2 },
    supplyAddress: { value: null, confidence: 0 },
    billedAmount: { value: 42350, confidence: 94.2 },
  },
  gasOcr: null,
  totalCo2Kg: 137.2,
  userType: "소상공인",
  userTypeOverridden: false,
  zScore: 1.8,
  averageOcrConfidence: 94.2,
};

const electricFile = new File(["bill"], "electric.png", {
  type: "image/png",
});

describe("SupportPage", () => {
  it("redirects back to /upload when there is no diagnosis result", () => {
    renderWithDiagnosis(<SupportPage />, { electricFile, result: null });

    expect(replace).toHaveBeenCalledWith("/upload");
  });

  it("renders the dummy support programs", () => {
    renderWithDiagnosis(<SupportPage />, { electricFile, result: fakeResult });

    expect(
      screen.getByText(`${DUMMY_SUPPORT_PROGRAMS.length}건`),
    ).toBeInTheDocument();
    expect(
      screen.getByText("소상공인 에너지효율화 지원사업"),
    ).toBeInTheDocument();
    expect(screen.getByText("중소벤처기업부")).toBeInTheDocument();
    expect(screen.getByText("✅ 매칭 98%")).toBeInTheDocument();
    expect(
      screen.getByText("무료", { selector: "span.text-base" }),
    ).toBeInTheDocument();
  });

  it("shows an inline message per card instead of navigating", async () => {
    const user = userEvent.setup();

    renderWithDiagnosis(<SupportPage />, { electricFile, result: fakeResult });

    const buttons = screen.getAllByRole("button", {
      name: "지원사업 바로가기 →",
    });

    expect(buttons).toHaveLength(DUMMY_SUPPORT_PROGRAMS.length);
    await user.click(buttons[1]);

    expect(
      screen.getByText("신청 연동 기능은 준비 중이에요"),
    ).toBeInTheDocument();
  });

  it("links the login CTA to the login page", () => {
    renderWithDiagnosis(<SupportPage />, { electricFile, result: fakeResult });

    expect(
      screen.getByRole("link", { name: "로그인하고 리포트 저장하기 →" }),
    ).toHaveAttribute("href", "/login");
  });
});
