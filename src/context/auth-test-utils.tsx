import { render } from "@testing-library/react";
import { useState, type ReactElement } from "react";
import { AuthContext, type AuthContextValue } from "./auth-context";
import {
  DiagnosisContext,
  type DiagnosisContextValue,
} from "./diagnosis-context";

type AuthStateOverrides = Partial<Omit<AuthContextValue, "login" | "logout">>;

type DiagnosisStateOverrides = Partial<
  Omit<
    DiagnosisContextValue,
    | "setAddress"
    | "setElectricFile"
    | "setGasFile"
    | "setResult"
    | "setStatus"
    | "setUserTypeOverride"
    | "setSelectedActionCodes"
    | "setEsgSurveyAnswers"
    | "reset"
  >
>;

const defaultAuthState: AuthStateOverrides = {
  token: null,
  user: null,
  isHydrated: true,
};

const defaultDiagnosisState: DiagnosisStateOverrides = {
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

// 로그인이 필요한 화면(마이페이지, 로그인 페이지 등)은 BottomNavigation을 통해
// DiagnosisContext도 같이 읽기 때문에 두 컨텍스트를 함께 감싼다.
export function renderWithAuth(
  ui: ReactElement,
  authOverrides: AuthStateOverrides = {},
  diagnosisOverrides: DiagnosisStateOverrides = {},
) {
  function Wrapper() {
    const [authState, setAuthState] = useState({
      ...defaultAuthState,
      ...authOverrides,
    });
    const [diagnosisState, setDiagnosisState] = useState({
      ...defaultDiagnosisState,
      ...diagnosisOverrides,
    });

    const authValue: AuthContextValue = {
      token: null,
      user: null,
      isHydrated: true,
      ...authState,
      login: (token, user) =>
        setAuthState((current) => ({ ...current, token, user })),
      logout: () => setAuthState({ token: null, user: null, isHydrated: true }),
    };

    const diagnosisValue: DiagnosisContextValue = {
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
      ...diagnosisState,
      setAddress: () => {},
      setElectricFile: () => {},
      setGasFile: () => {},
      setResult: () => {},
      setStatus: () => {},
      setUserTypeOverride: () => {},
      setSelectedActionCodes: () => {},
      setEsgSurveyAnswers: () => {},
      setXgboostResult: (xgboostResult) =>
        setDiagnosisState((current) => ({ ...current, xgboostResult })),
      setAiInsight: () => {},
      reset: () => {},
    };

    return (
      <div data-phone-frame>
        <AuthContext.Provider value={authValue}>
          <DiagnosisContext.Provider value={diagnosisValue}>
            {ui}
          </DiagnosisContext.Provider>
        </AuthContext.Provider>
      </div>
    );
  }

  return render(<Wrapper />);
}
