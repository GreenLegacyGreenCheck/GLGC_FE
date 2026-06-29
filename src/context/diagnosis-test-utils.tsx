import { render } from "@testing-library/react";
import { useState, type ReactElement } from "react";
import {
  DiagnosisContext,
  type DiagnosisContextValue,
} from "./diagnosis-context";

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
      reset: () => setState(defaultState),
    };

    return (
      <div data-phone-frame>
        <DiagnosisContext.Provider value={value}>
          {ui}
        </DiagnosisContext.Provider>
      </div>
    );
  }

  return render(<Wrapper />);
}
