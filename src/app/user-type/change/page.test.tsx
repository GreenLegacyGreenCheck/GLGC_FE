import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithDiagnosis } from "@/context/diagnosis-test-utils";
import {
  useDiagnosis,
  type DiagnosisResult,
} from "@/context/diagnosis-context";
import ChangeUserTypePage from "./page";

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
    billedAmount: { value: 42350, confidence: 94.2 },
  },
  gasOcr: null,
  totalCo2Kg: 137.2,
  userType: "소상공인",
  userTypeOverridden: false,
  zScore: 1.8,
  averageOcrConfidence: 94.2,
};

const electricFile = new File(["bill"], "electric.png", {
  type: "image/png",
});

function ResultProbe() {
  const { result } = useDiagnosis();

  return (
    <div data-testid="probe">
      {result?.userType} / {String(result?.userTypeOverridden)}
    </div>
  );
}

describe("ChangeUserTypePage", () => {
  it("redirects back to /upload when there is no diagnosis result", () => {
    renderWithDiagnosis(<ChangeUserTypePage />, {
      electricFile,
      result: null,
    });

    expect(replace).toHaveBeenCalledWith("/upload");
  });

  it("renders all three types with the current classification pre-selected", () => {
    renderWithDiagnosis(<ChangeUserTypePage />, {
      electricFile,
      result: fakeResult,
    });

    expect(
      screen.getByRole("heading", { name: "사용자 유형 변경" }),
    ).toBeInTheDocument();
    expect(screen.getByText("소상공인")).toBeInTheDocument();
    expect(screen.getByText("일반 가구")).toBeInTheDocument();
    expect(screen.getByText("기후 취약계층")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /소상공인/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("lets the user pick a different type and confirm the override", async () => {
    const user = userEvent.setup();

    renderWithDiagnosis(
      <>
        <ChangeUserTypePage />
        <ResultProbe />
      </>,
      { electricFile, result: fakeResult },
    );

    await user.click(screen.getByRole("button", { name: /일반 가구/ }));
    await user.click(
      screen.getByRole("button", { name: "이 유형으로 변경하기 →" }),
    );

    expect(push).toHaveBeenCalledWith("/user-type");
    expect(screen.getByTestId("probe")).toHaveTextContent("일반가구 / true");
  });
});
