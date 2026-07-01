import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithDiagnosis } from "@/context/diagnosis-test-utils";
import type { DiagnosisResult } from "@/context/diagnosis-context";
import SupportPage from "./page";

const replace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
}));

const getActionPolicy = vi.fn();

vi.mock("@/lib/diagnosis-api", () => ({
  getActionPolicy: (...args: unknown[]) => getActionPolicy(...args),
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

describe("SupportPage", () => {
  it("redirects back to /upload when there is no diagnosis result", () => {
    renderWithDiagnosis(<SupportPage />, { electricFile, result: null });

    expect(replace).toHaveBeenCalledWith("/upload");
  });

  it("shows an empty-state message when no action was selected", () => {
    renderWithDiagnosis(<SupportPage />, {
      electricFile,
      result: fakeResult,
      selectedActionCodes: [],
    });

    expect(
      screen.getByText("감축 액션을 먼저 선택하면 맞춤 지원사업을 보여드려요."),
    ).toBeInTheDocument();
  });

  it("fetches and renders matched support programs for each selected action", async () => {
    getActionPolicy.mockResolvedValue({
      programs: [
        {
          title: "소상공인 에너지효율화 지원사업",
          actionTitle: "LED 조명 교체",
          description: "노후 조명을 LED로 교체하는 지원사업입니다.",
          documents: "사업자등록증 · 견적서",
          link: "https://example.com/programs/led",
          difficulty: "쉬움",
          carbonSaving: "연 30만원",
        },
      ],
      defaultActions: [],
    });

    renderWithDiagnosis(<SupportPage />, {
      electricFile,
      result: fakeResult,
      selectedActionCodes: ["LED_LIGHTING"],
    });

    expect(
      await screen.findByText("소상공인 에너지효율화 지원사업"),
    ).toBeInTheDocument();
    expect(screen.getByText("LED 조명 교체")).toBeInTheDocument();
    expect(screen.getByText("연 30만원")).toBeInTheDocument();

    const link = screen.getByRole("link", { name: "지원사업 바로가기" });
    expect(link).toHaveAttribute("href", "https://example.com/programs/led");
    expect(link).toHaveAttribute("target", "_blank");
  });

  it("shows a message when no program matches the selected actions", async () => {
    getActionPolicy.mockResolvedValue({ programs: [], defaultActions: [] });

    renderWithDiagnosis(<SupportPage />, {
      electricFile,
      result: fakeResult,
      selectedActionCodes: ["LED_LIGHTING"],
    });

    expect(
      await screen.findByText(
        "선택한 액션에 매칭되는 지원사업을 찾지 못했어요.",
      ),
    ).toBeInTheDocument();
  });

  it("falls back to default action suggestions when RAG has no custom match", async () => {
    getActionPolicy.mockResolvedValue({
      programs: [],
      defaultActions: [
        {
          id: 1,
          title: "관할 지자체 복지센터 방문 상담",
          description:
            "거주하시는 지역의 행정복지센터에서 맞춤형 오프라인 상담을 받아보세요.",
          url: "https://www.bokjiro.go.kr",
        },
      ],
    });

    renderWithDiagnosis(<SupportPage />, {
      electricFile,
      result: fakeResult,
      selectedActionCodes: ["LED_LIGHTING"],
    });

    expect(
      await screen.findByText("이런 도움을 받아보세요"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("관할 지자체 복지센터 방문 상담"),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "바로가기" })).toHaveAttribute(
      "href",
      "https://www.bokjiro.go.kr",
    );
  });

  it("links the login CTA to the login page", () => {
    renderWithDiagnosis(<SupportPage />, {
      electricFile,
      result: fakeResult,
      selectedActionCodes: [],
    });

    expect(
      screen.getByRole("link", { name: "로그인하고 리포트 저장하기" }),
    ).toHaveAttribute("href", "/login");
  });
});
