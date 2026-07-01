import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import {
  DiagnosisProvider,
  useDiagnosis,
  type DiagnosisResult,
} from "./diagnosis-context";

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

function Consumer() {
  const { address, result, isHydrated, setAddress, setResult } = useDiagnosis();

  return (
    <div>
      <p data-testid="hydrated">{String(isHydrated)}</p>
      <p data-testid="address">{address}</p>
      <p data-testid="result">{result ? result.diagnosisId : "none"}</p>
      <button onClick={() => setAddress("서울시 마포구")}>set-address</button>
      <button onClick={() => setResult(fakeResult)}>set-result</button>
    </div>
  );
}

describe("DiagnosisProvider", () => {
  afterEach(() => {
    window.localStorage.clear();
  });

  it("survives a page refresh: state set before unmount reappears in a freshly mounted provider", async () => {
    const user = userEvent.setup();
    const { unmount } = render(
      <DiagnosisProvider>
        <Consumer />
      </DiagnosisProvider>,
    );

    await user.click(screen.getByText("set-address"));
    await user.click(screen.getByText("set-result"));

    expect(screen.getByTestId("address")).toHaveTextContent("서울시 마포구");
    expect(screen.getByTestId("result")).toHaveTextContent("diagnosis-1");

    // 새로고침은 전체 JS 컨텍스트를 새로 만드는 것과 같으므로, 기존 Provider를
    // unmount하고 완전히 새로운 Provider를 mount해 같은 상황을 재현한다.
    // sessionStorage만 살아남는다는 점이 핵심이다.
    unmount();

    render(
      <DiagnosisProvider>
        <Consumer />
      </DiagnosisProvider>,
    );

    expect(await screen.findByTestId("address")).toHaveTextContent(
      "서울시 마포구",
    );
    expect(screen.getByTestId("result")).toHaveTextContent("diagnosis-1");
  });

  it("starts with no persisted state when sessionStorage is empty", () => {
    render(
      <DiagnosisProvider>
        <Consumer />
      </DiagnosisProvider>,
    );

    expect(screen.getByTestId("address")).toHaveTextContent("");
    expect(screen.getByTestId("result")).toHaveTextContent("none");
  });
});
