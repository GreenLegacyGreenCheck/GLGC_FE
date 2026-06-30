import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithDiagnosis } from "@/context/diagnosis-test-utils";
import { renderWithAuth } from "@/context/auth-test-utils";
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

const diagnoseWithXgboost = vi.fn();

vi.mock("@/lib/diagnosis-api", () => ({
  diagnoseWithXgboost: (...args: unknown[]) => diagnoseWithXgboost(...args),
}));

const getMyDiagnoses = vi.fn();

vi.mock("@/lib/users-api", () => ({
  getMyDiagnoses: (...args: unknown[]) => getMyDiagnoses(...args),
}));

const getAiInsight = vi.fn();

vi.mock("@/lib/ai-api", () => ({
  getAiInsight: (...args: unknown[]) => getAiInsight(...args),
}));

beforeEach(() => {
  // 기본값은 실패 — 대부분의 테스트는 더미 리포트 수치를 그대로 확인하므로,
  // 원인 분석 API가 응답 못 했을 때와 같은 상태로 둔다.
  diagnoseWithXgboost.mockReset();
  diagnoseWithXgboost.mockRejectedValue(new Error("not mocked"));
  getMyDiagnoses.mockReset();
  getMyDiagnoses.mockResolvedValue({
    diagnoses: [],
    summary: {
      diagnosisCount: 0,
      lowestEmissionTons: 0,
      recentTrend: "steady",
      trendChangePercent: 0,
      trendSparkline: [],
    },
  });
  getAiInsight.mockReset();
  getAiInsight.mockRejectedValue(new Error("not mocked"));
});

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

  it("links the re-diagnose CTA back to the bill upload page", () => {
    renderWithDiagnosis(<ReportPage />, { electricFile, result: fakeResult });

    expect(screen.getByRole("link", { name: "다시 진단받기" })).toHaveAttribute(
      "href",
      "/upload",
    );
  });
});

const fakeXgboostBase = {
  energyGrade: { annualEmissionTons: 1.2 },
  causeAnalysis: {
    totalEmissionTons: 0.1,
    elecRatioPercent: 80,
    gasRatioPercent: 20,
    rankedFactors: [
      { factor: "전기 사용량", valuePercent: -40, rank: 1 },
      { factor: "가스 사용량", valuePercent: 20, rank: 2 },
    ],
    comparisonMetrics: {
      elecVsAvgPercent: -40,
      gasVsAvgPercent: 20,
      coolingVsAvgPercent: 5,
    },
  },
  averageComparison: {
    nationalAverageTons: 2.0,
    industryAverageTons: 2.2,
    diffVsNationalPercent: -40,
    diffVsIndustryPercent: -45.5,
    zScore: -0.5,
    rankPercentile: 80,
  },
  monthlyComparison: null,
  trendPrediction: { predictedAnnualTons: 1.1 },
  reductionGoal: {
    currentAnnualTons: 1.2,
    targetAnnualTons: 1.0,
    progressPercent: 60,
  },
  costSaving: {
    currentAnnualCostKrw: 500000,
    expectedAnnualCostKrw: 400000,
    expectedSavingKrw: 100000,
  },
};

describe("ReportPage XGBoost overlay", () => {
  it("overlays real emissions, grade and ESG scores once XGBoost responds", async () => {
    diagnoseWithXgboost.mockResolvedValue({
      ...fakeXgboostBase,
      esgScore: {
        e: {
          emissionScore: 100,
          energyScore: 100,
          surveyScore: 80,
          finalScore: 93,
        },
        s: 75,
        g: 60,
      },
    });

    renderWithDiagnosis(<ReportPage />, {
      electricFile,
      result: fakeResult,
      esgSurveyAnswers: { "E-1-2": 4 },
    });

    // grade A (<=1.5t) and the real annual tons replace the dummy "C"/2.84.
    expect(await screen.findAllByText("A")).not.toHaveLength(0);
    expect(screen.getAllByText("1.2").length).toBeGreaterThan(0);
    expect(screen.getByText("93")).toBeInTheDocument();
    expect(screen.getByText("75")).toBeInTheDocument();
    expect(screen.getByText("60")).toBeInTheDocument();
  });

  it("keeps the dummy ESG scores when the survey was skipped, even if XGBoost responds", async () => {
    diagnoseWithXgboost.mockResolvedValue({
      ...fakeXgboostBase,
      esgScore: {
        e: {
          emissionScore: 100,
          energyScore: 100,
          surveyScore: null,
          finalScore: 100,
        },
        s: null,
        g: null,
      },
    });

    renderWithDiagnosis(<ReportPage />, {
      electricFile,
      result: fakeResult,
      esgSurveyAnswers: {},
    });

    // 배출량/등급은 그대로 실데이터로 바뀌지만, ESG 점수는 더미(42/68/55)를 유지한다.
    expect(await screen.findAllByText("A")).not.toHaveLength(0);
    expect(screen.getByText("42")).toBeInTheDocument();
    expect(screen.getByText("68")).toBeInTheDocument();
    expect(screen.getByText("55")).toBeInTheDocument();
  });

  it("shows real average comparison, a single trend scenario, goal and cost savings", async () => {
    diagnoseWithXgboost.mockResolvedValue({
      ...fakeXgboostBase,
      esgScore: {
        e: {
          emissionScore: 100,
          energyScore: 100,
          surveyScore: null,
          finalScore: 100,
        },
        s: null,
        g: null,
      },
    });

    renderWithDiagnosis(<ReportPage />, {
      electricFile,
      result: fakeResult,
      esgSurveyAnswers: {},
    });

    expect(await screen.findByText("-40% 낮음")).toBeInTheDocument();
    expect(screen.getByText("현재 추세 유지 시")).toBeInTheDocument();
    expect(screen.queryByText("추천 액션 적용 시")).not.toBeInTheDocument();
    expect(screen.getAllByText("1.1t").length).toBeGreaterThan(0);
    expect(screen.getAllByText("1t").length).toBeGreaterThan(0);
    expect(screen.getByText("60%")).toBeInTheDocument();
    expect(screen.getByText("50만원")).toBeInTheDocument();
    expect(screen.getByText("40만원")).toBeInTheDocument();
    expect(screen.getByText("연간 약 10만원 절감")).toBeInTheDocument();
  });

  it("sends the previous diagnosis's electricity usage as prev_elec_kwh when logged in", async () => {
    getMyDiagnoses.mockResolvedValue({
      diagnoses: [
        { id: "diagnosis-1", usageKwh: 287 },
        { id: "diagnosis-0", usageKwh: 410 },
      ],
      summary: {
        diagnosisCount: 2,
        lowestEmissionTons: 1,
        recentTrend: "improving",
        trendChangePercent: -10,
        trendSparkline: [1, 1.2],
      },
    });
    diagnoseWithXgboost.mockResolvedValue({
      ...fakeXgboostBase,
      esgScore: {
        e: {
          emissionScore: 100,
          energyScore: 100,
          surveyScore: null,
          finalScore: 100,
        },
        s: null,
        g: null,
      },
    });

    renderWithAuth(
      <ReportPage />,
      { token: "token-1", user: { id: "user-1", email: "a@b.com" } },
      { electricFile, result: fakeResult, esgSurveyAnswers: {} },
    );

    await screen.findAllByText("A");

    expect(diagnoseWithXgboost).toHaveBeenCalledWith(
      expect.objectContaining({ prevElecKwh: 410 }),
    );
  });
});
