import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithDiagnosis } from "@/context/diagnosis-test-utils";
import type {
  DiagnosisResult,
  RecommendedActionView,
} from "@/context/diagnosis-context";
import ActionsPage from "./page";

const replace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
}));

const fakeActions: RecommendedActionView[] = [
  {
    code: "LED_LIGHTING",
    icon: "💡",
    title: "LED 조명 전면 교체",
    description: "기존 형광등을 LED로 교체해 조명 전력 최대 60% 절감",
    difficulty: "쉬움",
    costLabel: "50~150만원",
    expectedMinKg: 120,
    expectedMaxKg: 200,
  },
  {
    code: "STANDBY_POWER",
    icon: "🔌",
    title: "대기전력 차단기 설치",
    description: "영업 종료 후 일괄 차단으로 불필요한 전력 소비 방지",
    difficulty: "쉬움",
    costLabel: "5~20만원",
    expectedMinKg: 85,
    expectedMaxKg: 100,
  },
];

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
  recommendedActions: fakeActions,
  hasGasBill: false,
};

const electricFile = new File(["bill"], "electric.png", {
  type: "image/png",
});

describe("ActionsPage", () => {
  it("redirects back to /upload when there is no diagnosis result", () => {
    renderWithDiagnosis(<ActionsPage />, { electricFile, result: null });

    expect(replace).toHaveBeenCalledWith("/upload");
  });

  it("renders the recommended action list with the user's classification badge", () => {
    renderWithDiagnosis(<ActionsPage />, { electricFile, result: fakeResult });

    expect(
      screen.getByRole("heading", {
        name: `맞춤 감축 액션 ${fakeActions.length}가지`,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByText("소상공인").some((node) => node.tagName === "SPAN"),
    ).toBe(true);
    expect(screen.getByText("LED 조명 전면 교체")).toBeInTheDocument();
    expect(screen.getByText("-120~200 kg/년")).toBeInTheDocument();
    expect(screen.getAllByText("쉬움").length).toBeGreaterThan(0);
  });

  it("toggles an action's selected state when clicked", async () => {
    const user = userEvent.setup();

    renderWithDiagnosis(<ActionsPage />, { electricFile, result: fakeResult });

    const firstAction = screen.getByRole("button", {
      name: /LED 조명 전면 교체/,
    });

    expect(firstAction).toHaveAttribute("aria-pressed", "false");
    await user.click(firstAction);
    expect(firstAction).toHaveAttribute("aria-pressed", "true");
  });

  it("shows a running total of expected reduction as actions are selected", async () => {
    const user = userEvent.setup();

    renderWithDiagnosis(<ActionsPage />, { electricFile, result: fakeResult });

    expect(screen.queryByText(/개 선택 시 예상 절감/)).not.toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: /LED 조명 전면 교체/ }),
    );
    await user.click(
      screen.getByRole("button", { name: /대기전력 차단기 설치/ }),
    );

    expect(screen.getByText("2개 선택 시 예상 절감")).toBeInTheDocument();
    expect(screen.getByText("-205~300 kg CO₂/년")).toBeInTheDocument();
  });

  it("links the apply CTA to the support-programs page", () => {
    renderWithDiagnosis(<ActionsPage />, { electricFile, result: fakeResult });

    expect(
      screen.getByRole("link", { name: "맞춤 지원사업 신청하기" }),
    ).toHaveAttribute("href", "/support");
  });
});
