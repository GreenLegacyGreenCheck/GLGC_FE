import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithDiagnosis } from "@/context/diagnosis-test-utils";
import type { DiagnosisResult } from "@/context/diagnosis-context";
import type { EsgSurveyQuestion } from "@/lib/esg-survey";
import AnalyzingPage from "./page";

const push = vi.fn();
const replace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace }),
}));

vi.mock("@/lib/pipeline", () => ({
  runDiagnosisPipeline: vi.fn(),
}));

const getEsgQuestions = vi.fn();
const diagnoseWithXgboost = vi.fn();

vi.mock("@/lib/diagnosis-api", () => ({
  getEsgQuestions: () => getEsgQuestions(),
  diagnoseWithXgboost: (...args: unknown[]) => diagnoseWithXgboost(...args),
}));

const getAiInsight = vi.fn();

vi.mock("@/lib/ai-api", () => ({
  getAiInsight: (...args: unknown[]) => getAiInsight(...args),
}));

const fakeEsgQuestions: EsgSurveyQuestion[] = [
  {
    id: "E-1",
    category: "E",
    categoryLabel: "환경 (E)",
    text: "E 문항 1",
    icon: () => null,
  },
  {
    id: "E-2",
    category: "E",
    categoryLabel: "환경 (E)",
    text: "E 문항 2",
    icon: () => null,
  },
  {
    id: "S-1",
    category: "S",
    categoryLabel: "사회 (S)",
    text: "S 문항 1",
    icon: () => null,
  },
  {
    id: "S-2",
    category: "S",
    categoryLabel: "사회 (S)",
    text: "S 문항 2",
    icon: () => null,
  },
  {
    id: "G-1",
    category: "G",
    categoryLabel: "거버넌스 (G)",
    text: "G 문항 1",
    icon: () => null,
  },
  {
    id: "G-2",
    category: "G",
    categoryLabel: "거버넌스 (G)",
    text: "G 문항 2",
    icon: () => null,
  },
];

const fakeResult: DiagnosisResult = {
  electricOcr: null,
  gasOcr: null,
  totalCo2Kg: 0,
  userType: "일반가구",
  userTypeOverridden: false,
  zScore: 0,
  averageOcrConfidence: 90,
  diagnosisId: "diagnosis-1",
  recommendedActions: [],
  hasGasBill: false,
};

describe("AnalyzingPage", () => {
  beforeEach(() => {
    push.mockClear();
    replace.mockClear();
    getEsgQuestions.mockReset();
    getEsgQuestions.mockResolvedValue(fakeEsgQuestions);
    diagnoseWithXgboost.mockReset();
    diagnoseWithXgboost.mockResolvedValue({});
    getAiInsight.mockReset();
    getAiInsight.mockResolvedValue({
      aiSummary: "",
      aiEvidenceBullets: [],
      actionReasons: {},
    });
  });

  it("redirects back to /upload when there is no electric bill in context", () => {
    renderWithDiagnosis(<AnalyzingPage />, { electricFile: null });

    expect(replace).toHaveBeenCalledWith("/upload");
  });

  it("redirects straight to /user-type when both the diagnosis and the ESG survey are already done", () => {
    const electricFile = new File(["bill"], "electric.png", {
      type: "image/png",
    });

    renderWithDiagnosis(<AnalyzingPage />, {
      electricFile,
      status: "done",
      result: fakeResult,
      esgSurveyAnswers: { "E-1": 4 },
    });

    expect(replace).toHaveBeenCalledWith("/user-type");
  });

  it("forces the ESG survey open instead of redirecting when the diagnosis is done but the survey isn't", async () => {
    const electricFile = new File(["bill"], "electric.png", {
      type: "image/png",
    });

    renderWithDiagnosis(<AnalyzingPage />, {
      electricFile,
      status: "done",
      result: fakeResult,
      esgSurveyAnswers: null,
    });

    expect(replace).not.toHaveBeenCalledWith("/user-type");
    expect(await screen.findByText("환경 (E)")).toBeInTheDocument();
  });

  it("renders the step checklist and navigates to /user-type only after the pipeline resolves and the survey is completed", async () => {
    const { runDiagnosisPipeline } = await import("@/lib/pipeline");
    vi.mocked(runDiagnosisPipeline).mockImplementation(
      async (_input, onProgress) => {
        onProgress("ocr");
        onProgress("scope2");
        onProgress("classify");
        onProgress("report");
        return fakeResult;
      },
    );

    const electricFile = new File(["bill"], "electric.png", {
      type: "image/png",
    });
    const user = userEvent.setup();

    renderWithDiagnosis(<AnalyzingPage />, { electricFile });

    expect(screen.getByText("고지서 OCR 추출")).toBeInTheDocument();
    expect(screen.getByText("AI가 분석하고 있어요...")).toBeInTheDocument();

    // 분석이 끝나면 설문을 아직 안 했으므로 강제로 열린다 — 설문을 완료해야
    // 비로소 /user-type으로 넘어간다.
    await waitFor(
      () => expect(screen.getByText("환경 (E)")).toBeInTheDocument(),
      {
        timeout: 5000,
      },
    );

    for (let index = 0; index < fakeEsgQuestions.length; index += 1) {
      await user.click(screen.getByRole("button", { name: "4" }));
      const isLastQuestion = index === fakeEsgQuestions.length - 1;
      await user.click(
        screen.getByRole("button", {
          name: isLastQuestion ? "제출" : "다음",
        }),
      );
    }

    await waitFor(() => expect(push).toHaveBeenCalledWith("/user-type"), {
      timeout: 5000,
    });
  });
});
