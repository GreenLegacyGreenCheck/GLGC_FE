import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithDiagnosis as render } from "@/context/diagnosis-test-utils";
import HistoricalReportPage from "./page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  useParams: vi.fn(),
}));

const getDiagnosis = vi.fn();

vi.mock("@/lib/diagnosis-api", () => ({
  getDiagnosis: (...args: unknown[]) => getDiagnosis(...args),
}));

const { useParams } = await import("next/navigation");

describe("HistoricalReportPage", () => {
  it("renders the full report content for a past month", async () => {
    vi.mocked(useParams).mockReturnValue({ id: "2025-04" });
    getDiagnosis.mockResolvedValue({
      id: "2025-04",
      target: "소상공인",
      targetEmissionKg: 2840,
      address: "서울 마포구",
      usageKwh: 330,
      billingMonth: "2025-04",
      createdAt: "2025-04-10T00:00:00.000Z",
    });

    render(<HistoricalReportPage />);

    expect(
      await screen.findByRole("heading", { name: "2025년 4월 리포트" }),
    ).toBeInTheDocument();
    expect(screen.getByText("핵심 KPI")).toBeInTheDocument();
    expect(screen.getByText("평균 비교")).toBeInTheDocument();
    expect(screen.getByText("원인 분석 (SHAP)")).toBeInTheDocument();
    expect(screen.getByText("전월 비교")).toBeInTheDocument();
    expect(screen.getByText("추세 예측")).toBeInTheDocument();
    expect(
      screen.getByText("개선 후 모습 (Before / After)"),
    ).toBeInTheDocument();
    expect(screen.getByText("절감 목표")).toBeInTheDocument();
    expect(screen.getByText("절감 비용")).toBeInTheDocument();
    expect(screen.getByText("ESG 자가진단 점수")).toBeInTheDocument();
  });

  it("shows the real grade and emission total for a different month", async () => {
    vi.mocked(useParams).mockReturnValue({ id: "2025-01" });
    getDiagnosis.mockResolvedValue({
      id: "2025-01",
      target: "소상공인",
      targetEmissionKg: 3180,
      address: "서울 마포구",
      usageKwh: 387,
      billingMonth: "2025-01",
      createdAt: "2025-01-10T00:00:00.000Z",
    });

    render(<HistoricalReportPage />);

    expect(
      await screen.findByRole("heading", { name: "2025년 1월 리포트" }),
    ).toBeInTheDocument();
    expect(screen.getAllByText("D").length).toBeGreaterThan(0);
    expect(screen.getAllByText("3.18").length).toBeGreaterThan(0);
  });

  it("shows an error and a way back when the diagnosis can't be loaded", async () => {
    vi.mocked(useParams).mockReturnValue({ id: "not-a-real-id" });
    getDiagnosis.mockRejectedValue(new Error("진단 결과를 찾을 수 없습니다."));

    render(<HistoricalReportPage />);

    expect(
      await screen.findByText("진단 결과를 찾을 수 없습니다."),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: /리포트/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "마이페이지로 돌아가기" }),
    ).toHaveAttribute("href", "/mypage");
  });
});
