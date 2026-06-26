"use client";

import { createContext, useContext, useMemo, useState } from "react";

export type UserType = "소상공인" | "일반가구" | "취약계층";

export type OcrField<T> = {
  value: T | null;
  confidence: number;
};

export type OcrExtraction = {
  rawText: string;
  confidence: number;
  usageKwh: OcrField<number>;
  usageM3: OcrField<number>;
  contractType: OcrField<string>;
  supplyAddress: OcrField<string>;
  billedAmount: OcrField<number>;
};

export type DiagnosisResult = {
  electricOcr: OcrExtraction | null;
  gasOcr: OcrExtraction | null;
  totalCo2Kg: number;
  userType: UserType;
  userTypeOverridden: boolean;
  zScore: number;
  averageOcrConfidence: number;
};

export type DiagnosisStatus = "idle" | "running" | "done" | "error";

type DiagnosisState = {
  address: string;
  electricFile: File | null;
  gasFile: File | null;
  result: DiagnosisResult | null;
  status: DiagnosisStatus;
  error: string | null;
};

const initialState: DiagnosisState = {
  address: "",
  electricFile: null,
  gasFile: null,
  result: null,
  status: "idle",
  error: null,
};

export type DiagnosisContextValue = DiagnosisState & {
  setAddress: (address: string) => void;
  setElectricFile: (file: File | null) => void;
  setGasFile: (file: File | null) => void;
  setResult: (result: DiagnosisResult) => void;
  setStatus: (status: DiagnosisStatus, error?: string | null) => void;
  setUserTypeOverride: (userType: UserType) => void;
  reset: () => void;
};

export const DiagnosisContext = createContext<DiagnosisContextValue | null>(
  null,
);

export function DiagnosisProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<DiagnosisState>(initialState);

  const value = useMemo<DiagnosisContextValue>(
    () => ({
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
      reset: () => setState(initialState),
    }),
    [state],
  );

  return (
    <DiagnosisContext.Provider value={value}>
      {children}
    </DiagnosisContext.Provider>
  );
}

export function useDiagnosis() {
  const context = useContext(DiagnosisContext);

  if (!context) {
    throw new Error("useDiagnosis must be used within a DiagnosisProvider");
  }

  return context;
}
