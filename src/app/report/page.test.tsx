import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithDiagnosis } from "@/context/diagnosis-test-utils";
import type { DiagnosisResult } from "@/context/diagnosis-context";
import ReportPage from "./page";

const replace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
}));

const downloadReportPdf = vi.fn().mockResolvedValue(undefined);

vi.mock("@/lib/report-pdf", () => ({
  downloadReportPdf: (...args: unknown[]) => downloadReportPdf(...args),
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

describe("ReportPage", () => {
  it("redirects back to /upload when there is no diagnosis result", () => {
    renderWithDiagnosis(<ReportPage />, { electricFile, result: null });

    expect(replace).toHaveBeenCalledWith("/upload");
  });

  it("renders the dummy report figures", () => {
    renderWithDiagnosis(<ReportPage />, { electricFile, result: fakeResult });

    expect(
      screen.getByRole("heading", { name: "탄소배출 진단 결과" }),
    ).toBeInTheDocument();
    expect(screen.getAllByText("2.84").length).toBeGreaterThan(0);
    expect(screen.getAllByText("C").length).toBeGreaterThan(0);
    expect(screen.getByText("+32% 높음")).toBeInTheDocument();
    expect(screen.getByText("68")).toBeInTheDocument();
    expect(screen.getByText("55")).toBeInTheDocument();
  });

  it("renders the SHAP causes, month-over-month and comparison sections", () => {
    renderWithDiagnosis(<ReportPage />, { electricFile, result: fakeResult });

    expect(screen.getByText("전기 사용량")).toBeInTheDocument();
    expect(screen.getByText("+42%")).toBeInTheDocument();
    expect(screen.getByText("동종업 평균")).toBeInTheDocument();
    expect(screen.getByText("2.36")).toBeInTheDocument();
    expect(screen.getByText("306 → 330kWh")).toBeInTheDocument();
    expect(screen.getByText("▲ 7.9% 증가")).toBeInTheDocument();
  });

  it("updates the simulation projection when a different degree is selected", async () => {
    const user = userEvent.setup();

    renderWithDiagnosis(<ReportPage />, { electricFile, result: fakeResult });

    expect(screen.getByText("2.56t")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "3도" }));
    expect(screen.getByText("2.42t")).toBeInTheDocument();
  });

  it("renders the AI summary, goal, grade prediction and cost savings cards", () => {
    renderWithDiagnosis(<ReportPage />, { electricFile, result: fakeResult });

    expect(screen.getByText("✨ AI 종합 의견")).toBeInTheDocument();
    expect(screen.getByText("69%")).toBeInTheDocument();
    expect(screen.getByText("탄소 절감 목표")).toBeInTheDocument();
    expect(screen.getByText("2.5t")).toBeInTheDocument();
    expect(screen.getByText("탄소 등급 변화 예측")).toBeInTheDocument();
    expect(screen.getByText("66만원/년")).toBeInTheDocument();
    expect(screen.getByText("연간 약 8만원 절감")).toBeInTheDocument();
  });

  it("downloads a PDF when the download button is clicked", async () => {
    const user = userEvent.setup();

    renderWithDiagnosis(<ReportPage />, { electricFile, result: fakeResult });

    await user.click(
      screen.getByRole("button", { name: "리포트 PDF 다운로드 ⬇" }),
    );

    expect(downloadReportPdf).toHaveBeenCalled();
  });

  it("links the actions CTA to the reduction-actions page", () => {
    renderWithDiagnosis(<ReportPage />, { electricFile, result: fakeResult });

    expect(
      screen.getByRole("link", { name: "감축 액션 추천 보기 →" }),
    ).toHaveAttribute("href", "/actions");
  });
});
