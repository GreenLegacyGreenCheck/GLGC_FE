import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { DiagnosisResult } from "@/context/diagnosis-context";
import { renderWithDiagnosis } from "@/context/diagnosis-test-utils";
import BottomNavigation from "./BottomNavigation";

const fakeResult: DiagnosisResult = {
  electricOcr: null,
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

describe("BottomNavigation", () => {
  it("links the report tab to /upload when no diagnosis result exists yet", () => {
    renderWithDiagnosis(<BottomNavigation />, { result: null });

    expect(screen.getByRole("link", { name: /진단 리포트/ })).toHaveAttribute(
      "href",
      "/upload",
    );
  });

  it("links the report tab straight to /report once a diagnosis result exists", () => {
    renderWithDiagnosis(<BottomNavigation />, { result: fakeResult });

    expect(screen.getByRole("link", { name: /진단 리포트/ })).toHaveAttribute(
      "href",
      "/report",
    );
  });

  it("links the mypage tab to /mypage", () => {
    renderWithDiagnosis(<BottomNavigation />, { result: null });

    expect(screen.getByRole("link", { name: /마이페이지/ })).toHaveAttribute(
      "href",
      "/mypage",
    );
  });
});
