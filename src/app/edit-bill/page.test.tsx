import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithDiagnosis } from "@/context/diagnosis-test-utils";
import type { DiagnosisResult } from "@/context/diagnosis-context";
import EditBillPage from "./page";

const replace = vi.fn();
const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, push }),
}));

const fakeResult: DiagnosisResult = {
  electricOcr: {
    rawText: "",
    confidence: 94.2,
    usageKwh: { value: 287, confidence: 94.2 },
    usageM3: { value: null, confidence: 0 },
    contractType: { value: "주택용", confidence: 94.2 },
    supplyAddress: { value: null, confidence: 0 },
    billingMonth: { value: "2026-06", confidence: 94.2 },
  },
  gasOcr: {
    rawText: "",
    confidence: 88,
    usageKwh: { value: null, confidence: 0 },
    usageM3: { value: 45, confidence: 88 },
    contractType: { value: null, confidence: 0 },
    supplyAddress: { value: null, confidence: 0 },
    billingMonth: { value: "2026-06", confidence: 88 },
  },
  totalCo2Kg: 234.5,
  userType: "일반가구",
  userTypeOverridden: false,
  zScore: 0,
  averageOcrConfidence: 91.1,
  diagnosisId: "diagnosis-1",
  recommendedActions: [],
};

const electricFile = new File(["bill"], "electric.png", {
  type: "image/png",
});
const gasFile = new File(["bill"], "gas.png", { type: "image/png" });

describe("EditBillPage", () => {
  it("redirects back to /upload when there is no diagnosis result", () => {
    renderWithDiagnosis(<EditBillPage />, { electricFile, result: null });

    expect(replace).toHaveBeenCalledWith("/upload");
  });

  it("pre-fills the form with the OCR-extracted values, split by bill type", () => {
    renderWithDiagnosis(<EditBillPage />, {
      address: "서울시 마포구 연남동 123-4",
      electricFile,
      gasFile,
      result: fakeResult,
    });

    expect(
      screen.getByRole("heading", { name: "고지서 항목 수정" }),
    ).toBeInTheDocument();
    expect(screen.getByText("전기 고지서")).toBeInTheDocument();
    expect(screen.getByText("가스 고지서")).toBeInTheDocument();
    expect(screen.getByLabelText("전력 사용량")).toHaveValue("287");
    expect(screen.getByLabelText("가스 사용량")).toHaveValue("45");
    expect(screen.getByLabelText("주소")).toHaveValue(
      "서울시 마포구 연남동 123-4",
    );
    expect(screen.getByLabelText("고지서 기준월")).toHaveValue("2026-06");
  });

  it("omits the gas section when no gas bill was uploaded", () => {
    renderWithDiagnosis(<EditBillPage />, {
      electricFile,
      gasFile: null,
      result: fakeResult,
    });

    expect(screen.queryByText("가스 고지서")).not.toBeInTheDocument();
  });

  it("saves corrected values and navigates back to /user-type", async () => {
    const user = userEvent.setup();

    renderWithDiagnosis(<EditBillPage />, {
      electricFile,
      gasFile,
      result: fakeResult,
    });

    const usageInput = screen.getByLabelText("전력 사용량");

    await user.clear(usageInput);
    await user.type(usageInput, "500");
    await user.click(screen.getByRole("button", { name: "저장하고 계속하기" }));

    expect(push).toHaveBeenCalledWith("/user-type");
  });

  it("saves a corrected billing month", async () => {
    const user = userEvent.setup();

    renderWithDiagnosis(<EditBillPage />, {
      electricFile,
      gasFile,
      result: fakeResult,
    });

    const monthInput = screen.getByLabelText("고지서 기준월");

    await user.clear(monthInput);
    await user.type(monthInput, "2026-07");
    await user.click(screen.getByRole("button", { name: "저장하고 계속하기" }));

    expect(push).toHaveBeenCalledWith("/user-type");
  });
});
