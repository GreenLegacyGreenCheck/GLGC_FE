import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithDiagnosis } from "@/context/diagnosis-test-utils";
import type { DiagnosisResult } from "@/context/diagnosis-context";
import UserTypePage from "./page";

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
    billingMonth: { value: "2026-05", confidence: 88 },
  },
  totalCo2Kg: 234.5,
  userType: "소상공인",
  userTypeOverridden: false,
  zScore: 1.8,
  averageOcrConfidence: 91.1,
  diagnosisId: "diagnosis-1",
  recommendedActions: [],
};

const electricFile = new File(["bill"], "electric.png", {
  type: "image/png",
});
const gasFile = new File(["bill"], "gas.png", { type: "image/png" });

describe("UserTypePage", () => {
  it("redirects back to /upload when there is no diagnosis result", () => {
    renderWithDiagnosis(<UserTypePage />, { electricFile, result: null });

    expect(replace).toHaveBeenCalledWith("/upload");
  });

  it("renders the classification, summary and services for the diagnosis result", () => {
    renderWithDiagnosis(<UserTypePage />, {
      address: "서울시 마포구 연남동 123-4",
      electricFile,
      gasFile,
      result: fakeResult,
    });

    expect(
      screen.getByRole("heading", { name: "사용자 유형 확인" }),
    ).toBeInTheDocument();
    expect(screen.getByText("소상공인")).toBeInTheDocument();
    expect(screen.getByText("서울시 마포구 연남동 123-4")).toBeInTheDocument();
    expect(screen.getByText("287 kWh")).toBeInTheDocument();
    expect(screen.getByText("45 m³")).toBeInTheDocument();
    expect(screen.getByText("91.1%")).toBeInTheDocument();
  });

  it("shows each bill's billing month and usage separately, not merged", () => {
    renderWithDiagnosis(<UserTypePage />, {
      electricFile,
      gasFile,
      result: fakeResult,
    });

    expect(screen.getByText("전기 고지서 기준월")).toBeInTheDocument();
    expect(screen.getByText("2026-06")).toBeInTheDocument();
    expect(screen.getByText("가스 고지서 기준월")).toBeInTheDocument();
    expect(screen.getByText("2026-05")).toBeInTheDocument();
  });

  it("omits the gas billing rows when no gas bill was uploaded", () => {
    renderWithDiagnosis(<UserTypePage />, {
      electricFile,
      gasFile: null,
      result: fakeResult,
    });

    expect(screen.queryByText("가스 고지서 기준월")).not.toBeInTheDocument();
    expect(screen.queryByText("가스 사용량")).not.toBeInTheDocument();
  });

  it("links to the type-change page instead of toggling inline", () => {
    renderWithDiagnosis(<UserTypePage />, {
      electricFile,
      result: fakeResult,
    });

    expect(screen.getByRole("link", { name: /유형 변경하기/ })).toHaveAttribute(
      "href",
      "/user-type/change",
    );
  });

  it("links the report CTA to the report page", () => {
    renderWithDiagnosis(<UserTypePage />, {
      electricFile,
      result: fakeResult,
    });

    expect(
      screen.getByRole("link", { name: "진단 리포트 보기" }),
    ).toHaveAttribute("href", "/report");
  });
});
