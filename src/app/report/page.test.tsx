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
    billingMonth: { value: "2026-06", confidence: 94.2 },
  },
  gasOcr: null,
  totalCo2Kg: 137.2,
  userType: "소상공인",
  userTypeOverridden: false,
  zScore: 1.8,
  averageOcrConfidence: 94.2,
  diagnosisId: "diagnosis-1",
  recommendedActions: [],
  hasGasBill: false,
};

const electricFile = new File(["bill"], "electric.png", {
  type: "image/png",
});

describe("ReportPage", () => {
  it("redirects back to /upload when there is no diagnosis result", () => {
    renderWithDiagnosis(<ReportPage />, { electricFile, result: null });

    expect(replace).toHaveBeenCalledWith("/upload");
  });

  it("does not redirect while diagnosis state is still hydrating from a refresh", () => {
    replace.mockClear();

    renderWithDiagnosis(<ReportPage />, {
      result: null,
      isHydrated: false,
    });

    expect(replace).not.toHaveBeenCalled();
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
    expect(screen.getByText("306")).toBeInTheDocument();
    expect(screen.getByText("330")).toBeInTheDocument();
    expect(screen.getAllByText("kWh").length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText("▲ 7.9% 증가")).toBeInTheDocument();
  });

  it("updates the simulation projection when a different degree is selected", async () => {
    const user = userEvent.setup();

    renderWithDiagnosis(<ReportPage />, { electricFile, result: fakeResult });

    expect(screen.getByText("2.56t")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "3도" }));
    expect(screen.getByText("2.42t")).toBeInTheDocument();
  });

  it("renders the AI summary, goal and cost savings cards", () => {
    renderWithDiagnosis(<ReportPage />, { electricFile, result: fakeResult });

    expect(screen.getByText("AI 종합 의견")).toBeInTheDocument();
    expect(screen.getAllByText("69%").length).toBeGreaterThan(0);
    expect(screen.getByText("절감 목표")).toBeInTheDocument();
    expect(screen.getAllByText("2.5t").length).toBeGreaterThan(0);
    expect(screen.getByText("절감 비용")).toBeInTheDocument();
    expect(screen.getByText("66만원")).toBeInTheDocument();
    expect(screen.getAllByText("/ 년").length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText("연간 약 8만원 절감")).toBeInTheDocument();
  });

  it("renders the grade band scale and the usage percentile gauge", () => {
    renderWithDiagnosis(<ReportPage />, { electricFile, result: fakeResult });

    expect(screen.getByText("핵심 KPI")).toBeInTheDocument();
    // GradeBandScale is rendered twice (KPI card + trend forecast card):
    // the grade letter sits inside its colored segment, the tons range is
    // centered underneath it.
    expect(screen.getAllByText("0~1.5").length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText("3~4").length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText("평균 비교")).toBeInTheDocument();
    expect(screen.getByText("업종 내 사용량 백분위")).toBeInTheDocument();
    expect(screen.getByText("적게 사용")).toBeInTheDocument();
    expect(screen.getByText("많이 사용")).toBeInTheDocument();
  });

  it("renders the emission cause tree and the AI evidence bullets", () => {
    renderWithDiagnosis(<ReportPage />, { electricFile, result: fakeResult });

    expect(screen.getByText("원인 분석 (SHAP)")).toBeInTheDocument();
    expect(screen.getByText("총 배출량")).toBeInTheDocument();
    expect(screen.getByText("냉방기기")).toBeInTheDocument();
    expect(screen.getByText("조명·기타")).toBeInTheDocument();
    expect(
      screen.getByText("동종업 평균보다 전기 사용량 27% 높음"),
    ).toBeInTheDocument();
    expect(screen.getByText("가스 사용량은 평균 수준")).toBeInTheDocument();
  });

  it("renders both trend-forecast scenarios side by side", () => {
    renderWithDiagnosis(<ReportPage />, { electricFile, result: fakeResult });

    expect(screen.getByText("추세 예측")).toBeInTheDocument();
    expect(screen.getByText("현재 추세 유지 시")).toBeInTheDocument();
    expect(screen.getByText("추천 액션 적용 시")).toBeInTheDocument();
    expect(screen.getByText("3.02t")).toBeInTheDocument();
    expect(screen.getAllByText("D").length).toBeGreaterThan(0);
  });

  it("renders the before/after comparison card", () => {
    renderWithDiagnosis(<ReportPage />, { electricFile, result: fakeResult });

    expect(
      screen.getByText("개선 후 모습 (Before / After)"),
    ).toBeInTheDocument();
    expect(screen.getByText("Before")).toBeInTheDocument();
    expect(screen.getByText("After")).toBeInTheDocument();
  });

  it("downloads a PDF when the download button is clicked", async () => {
    const user = userEvent.setup();

    renderWithDiagnosis(<ReportPage />, { electricFile, result: fakeResult });

    await user.click(
      screen.getByRole("button", { name: "리포트 PDF 다운로드" }),
    );

    expect(downloadReportPdf).toHaveBeenCalled();
  });

  it("links the actions CTA to the reduction-actions page", () => {
    renderWithDiagnosis(<ReportPage />, { electricFile, result: fakeResult });

    expect(
      screen.getByRole("link", { name: "감축 액션 추천 보기" }),
    ).toHaveAttribute("href", "/actions");
  });
});
