import { screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithDiagnosis } from "@/context/diagnosis-test-utils";
import type { DiagnosisResult } from "@/context/diagnosis-context";
import AnalyzingPage from "./page";

const push = vi.fn();
const replace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace }),
}));

vi.mock("@/lib/pipeline", () => ({
  runDiagnosisPipeline: vi.fn(),
}));

const fakeResult: DiagnosisResult = {
  electricOcr: null,
  gasOcr: null,
  totalCo2Kg: 0,
  userType: "일반가구",
  userTypeOverridden: false,
  zScore: 0,
  averageOcrConfidence: 90,
};

describe("AnalyzingPage", () => {
  it("redirects back to /upload when there is no electric bill in context", () => {
    renderWithDiagnosis(<AnalyzingPage />, { electricFile: null });

    expect(replace).toHaveBeenCalledWith("/upload");
  });

  it("redirects straight to /user-type when the diagnosis is already done", () => {
    const electricFile = new File(["bill"], "electric.png", {
      type: "image/png",
    });

    renderWithDiagnosis(<AnalyzingPage />, {
      electricFile,
      status: "done",
      result: fakeResult,
    });

    expect(replace).toHaveBeenCalledWith("/user-type");
  });

  it("renders the step checklist and navigates to /user-type once the pipeline resolves", async () => {
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

    renderWithDiagnosis(<AnalyzingPage />, { electricFile });

    expect(screen.getByText("고지서 OCR 추출")).toBeInTheDocument();
    expect(screen.getByText("AI가 분석하고 있어요...")).toBeInTheDocument();

    await waitFor(() => expect(push).toHaveBeenCalledWith("/user-type"));
  });
});
