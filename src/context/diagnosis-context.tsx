"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { EsgSurveyAnswers } from "@/lib/esg-survey";

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
  billingMonth: OcrField<string>;
};

export type RecommendedActionView = {
  code: string;
  icon: string | null;
  title: string;
  description: string;
  difficulty: string;
  costLabel: string;
  expectedMinKg: number;
  expectedMaxKg: number;
};

export type DiagnosisResult = {
  electricOcr: OcrExtraction | null;
  gasOcr: OcrExtraction | null;
  totalCo2Kg: number;
  userType: UserType;
  userTypeOverridden: boolean;
  zScore: number;
  averageOcrConfidence: number;
  diagnosisId: string;
  recommendedActions: RecommendedActionView[];
  // 새로고침 후에는 File 객체를 복원할 수 없어 gasFile이 항상 null이 되므로,
  // 가스 고지서 업로드 여부는 result에 같이 저장해 둔다.
  hasGasBill: boolean;
};

export type DiagnosisStatus = "idle" | "running" | "done" | "error";

type DiagnosisState = {
  address: string;
  electricFile: File | null;
  gasFile: File | null;
  result: DiagnosisResult | null;
  status: DiagnosisStatus;
  error: string | null;
  // /actions에서 선택한 액션을 /support로 넘기기 위한 상태. /actions의 선택은
  // 로컬 state라 페이지 이동 시 사라지므로, 어떤 액션의 정책을 조회해야
  // 하는지 알려주려면 context에 들고 있어야 한다.
  selectedActionCodes: string[];
  // /analyzing에서 대기 시간에 받은 ESG 자가진단 설문 응답. 완주했을 때만
  // 채워지며, /report가 이 값이 있으면 더미 esgScores 대신 실제 응답 기반
  // 점수를 보여준다.
  esgSurveyAnswers: EsgSurveyAnswers | null;
  // /report에서 XGBoost 결과로 AI 인사이트를 받으면 여기 저장한다.
  // /actions 페이지가 이 값을 읽어 각 액션 카드에 개인화 이유를 보여준다.
  aiActionReasons: Record<string, string> | null;
};

const initialState: DiagnosisState = {
  address: "",
  electricFile: null,
  gasFile: null,
  result: null,
  status: "idle",
  error: null,
  selectedActionCodes: [],
  esgSurveyAnswers: null,
  aiActionReasons: null,
};

// 새로고침해도 같은 페이지에 남아있도록 진단 결과를 sessionStorage에 보관한다.
// File 객체(electricFile/gasFile)는 직렬화할 수 없어 여기서는 제외하고,
// 새로고침 후 다시 필요한 building block(결과/주소/선택한 액션)만 저장한다.
const STORAGE_KEY = "glgc-diagnosis";

type PersistedDiagnosisState = Pick<
  DiagnosisState,
  | "address"
  | "result"
  | "selectedActionCodes"
  | "esgSurveyAnswers"
  | "aiActionReasons"
>;

function readPersistedState(): PersistedDiagnosisState | null {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as PersistedDiagnosisState) : null;
  } catch {
    return null;
  }
}

export type DiagnosisContextValue = DiagnosisState & {
  // Provider가 sessionStorage를 아직 읽어오기 전까지는 true로, 페이지들이
  // 이 값을 보고 hydration이 끝나기 전에 /upload로 리다이렉트하지 않도록 한다.
  isHydrated: boolean;
  setAddress: (address: string) => void;
  setElectricFile: (file: File | null) => void;
  setGasFile: (file: File | null) => void;
  setResult: (result: DiagnosisResult) => void;
  setStatus: (status: DiagnosisStatus, error?: string | null) => void;
  setUserTypeOverride: (userType: UserType) => void;
  setSelectedActionCodes: (codes: string[]) => void;
  setEsgSurveyAnswers: (answers: EsgSurveyAnswers | null) => void;
  setAiActionReasons: (reasons: Record<string, string>) => void;
  reset: () => void;
};

export const DiagnosisContext = createContext<DiagnosisContextValue | null>(
  null,
);

export function DiagnosisProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<DiagnosisState>(initialState);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // sessionStorage는 서버에 없는 브라우저 전용 외부 저장소라 마운트 후
    // 한 번만 동기적으로 읽어와야 한다 (렌더 중에 읽으면 SSR과 클라이언트의
    // 첫 렌더 결과가 달라져 하이드레이션 오류가 난다).
    const persisted = readPersistedState();
    if (persisted) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setState((current) => ({ ...current, ...persisted }));
    }
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    const persisted: PersistedDiagnosisState = {
      address: state.address,
      result: state.result,
      selectedActionCodes: state.selectedActionCodes,
      esgSurveyAnswers: state.esgSurveyAnswers,
      aiActionReasons: state.aiActionReasons,
    };
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(persisted));
  }, [
    isHydrated,
    state.address,
    state.result,
    state.selectedActionCodes,
    state.esgSurveyAnswers,
    state.aiActionReasons,
  ]);

  const value = useMemo<DiagnosisContextValue>(
    () => ({
      ...state,
      isHydrated,
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
      setAiActionReasons: (aiActionReasons) =>
        setState((current) => ({ ...current, aiActionReasons })),
      reset: () => {
        window.sessionStorage.removeItem(STORAGE_KEY);
        setState(initialState);
      },
    }),
    [state, isHydrated],
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
