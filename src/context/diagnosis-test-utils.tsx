import { render } from "@testing-library/react";
import { useState, type ReactElement } from "react";
import { AuthContext, type AuthContextValue } from "./auth-context";
import {
  DiagnosisContext,
  type DiagnosisContextValue,
} from "./diagnosis-context";

// 진단 화면 대부분은 로그인 여부와 무관하게 동작하지만, 일부(예: 분석 진행
// 페이지)는 토큰을 옵션으로만 사용하는 useAuth()를 호출한다. 그런 화면도
// 깨지지 않도록 항상 비로그인 상태의 AuthContext로 같이 감싼다 — 로그인
// 상태 자체를 검증해야 하는 테스트는 auth-test-utils.tsx의 renderWithAuth를
// 쓴다.
const defaultAuthValue: AuthContextValue = {
  token: null,
  user: null,
  isHydrated: true,
  login: () => {},
  logout: () => {},
};

type DiagnosisStateOverrides = Partial<
  Omit<
    DiagnosisContextValue,
    | "setAddress"
    | "setElectricFile"
    | "setGasFile"
    | "setResult"
    | "setStatus"
    | "setUserTypeOverride"
    | "reset"
  >
>;

const defaultState: DiagnosisStateOverrides = {
  address: "",
  electricFile: null,
  gasFile: null,
  result: null,
  status: "idle",
  error: null,
  selectedActionCodes: [],
  esgSurveyAnswers: null,
  xgboostResult: null,
  aiInsight: null,
  isHydrated: true,
};

export function renderWithDiagnosis(
  ui: ReactElement,
  overrides: DiagnosisStateOverrides = {},
) {
  function Wrapper() {
    const [state, setState] = useState({ ...defaultState, ...overrides });

    const value: DiagnosisContextValue = {
      address: "",
      electricFile: null,
      gasFile: null,
      result: null,
      status: "idle",
      error: null,
      selectedActionCodes: [],
      esgSurveyAnswers: null,
      xgboostResult: null,
      aiInsight: null,
      isHydrated: true,
      ...state,
      setAddress: (address) => setState((current) => ({ ...current, address })),
      setElectricFile: (electricFile) =>
        setState((current) => ({ ...current, electricFile })),
      setGasFile: (gasFile) => setState((current) => ({ ...current, gasFile })),
      setResult: (result) => setState((current) => ({ ...current, result })),
      setStatus: (status, error = null) =>
        setState((current) => ({ ...current, status, error })),
      setUserTypeOverride: (userType) =>
        setState((current) =>
          current.result
            ? {
                ...current,
                result: {
                  ...current.result,
                  userType,
                  userTypeOverridden: true,
                },
              }
            : current,
        ),
      setSelectedActionCodes: (selectedActionCodes) =>
        setState((current) => ({ ...current, selectedActionCodes })),
      setEsgSurveyAnswers: (esgSurveyAnswers) =>
        setState((current) => ({ ...current, esgSurveyAnswers })),
      setXgboostResult: (xgboostResult) =>
        setState((current) => ({ ...current, xgboostResult })),
      setAiInsight: (aiInsight) =>
        setState((current) => ({ ...current, aiInsight })),
      reset: () => setState(defaultState),
    };

    return (
      <div data-phone-frame>
        <AuthContext.Provider value={defaultAuthValue}>
          <DiagnosisContext.Provider value={value}>
            {ui}
          </DiagnosisContext.Provider>
        </AuthContext.Provider>
      </div>
    );
  }

  return render(<Wrapper />);
}
