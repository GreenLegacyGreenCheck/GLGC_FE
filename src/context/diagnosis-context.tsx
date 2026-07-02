"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { EsgSurveyAnswers } from "@/lib/esg-survey";
import type { XgboostDiagnoseResult } from "@/lib/diagnosis-api";

// ai-api.ts가 이 파일의 RecommendedActionView를 import해서 순환 참조가 생기므로
// 관련 타입을 여기에 직접 정의한다.
export type AiActionScenario = {
  beforeText: string;
  afterText: string;
  reductionGoalText: string;
  costSavingText: string;
  evidenceText: string;
  projectedTons: number | null;
  percentReduction: number | null;
  estimatedMonthlySavingsWon: number | null;
  currentAnnualCostWon: number | null;
  projectedAnnualCostWon: number | null;
  annualSavingsWon: number | null;
  costEvidenceText: string;
  projectedTonsByDegree: { "1": number; "2": number; "3": number } | null;
};

export type AiAction = {
  code: string;
  icon: string | null;
  title: string;
  description: string;
  difficulty: string;
  costLabel: string;
  expectedMinKg: number;
  expectedMaxKg: number;
  reason: string;
  scenario: AiActionScenario | null;
};

export type AiInsightResult = {
  aiSummary: string;
  aiEvidenceBullets: { text: string; isPositive: boolean }[];
  // XGBoost 데이터를 근거로 Gemini가 직접 추론한 감축 액션 목록.
  // 각 액션에 개인화 근거(reason)가 내장되어 있다.
  actions: AiAction[];
};

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
  // XGBoost 원인 분석 결과. /analyzing 완료 후 미리 채워두면 /report 진입 시
  // 로딩 없이 바로 표시된다. 세션 간 재진단 시에는 null로 초기화한다.
  xgboostResult: XgboostDiagnoseResult | null;
  // Gemini AI 인사이트 전체. XGBoost가 끝난 뒤 /analyzing에서 미리 호출해
  // 여기 저장해두면 /report가 스피너 없이 짠 하고 나타날 수 있다.
  aiInsight: AiInsightResult | null;
  // 액션별 RAG 정책 결과 캐시. /report에서 aiInsight 확정 후 미리 fetch해
  // /support 진입 시 즉시 표시할 수 있도록 한다.
  ragCache: Record<string, { programs: unknown[]; defaultActions: unknown[] }>;
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
  xgboostResult: null,
  aiInsight: null,
  ragCache: {},
};

// localStorage를 쓰는 이유: 푸시 알림 클릭으로 새 탭이 열릴 때도
// 이전 진단 결과를 복원해야 하는데, sessionStorage는 탭마다 독립적이라
// 새 탭에서는 데이터가 없어 /upload로 튕겼다. localStorage는 탭 간 공유된다.
const STORAGE_KEY = "glgc-diagnosis";

type PersistedDiagnosisState = Pick<
  DiagnosisState,
  | "address"
  | "result"
  | "selectedActionCodes"
  | "esgSurveyAnswers"
  | "xgboostResult"
  | "aiInsight"
>;

function readPersistedState(): PersistedDiagnosisState | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedDiagnosisState;
    // aiInsight 포맷이 바뀌었을 때 구버전 데이터를 버린다.
    // 1) actions 배열 없음 → 구버전
    // 2) actions[0].scenario 없음 → scenario 필드 추가 전 구버전
    if (parsed.aiInsight) {
      const insight = parsed.aiInsight as Record<string, unknown>;
      const actions = insight.actions;
      const firstAction =
        Array.isArray(actions) && actions.length > 0
          ? (actions[0] as Record<string, unknown>)
          : null;
      if (
        !Array.isArray(actions) ||
        (firstAction && !("scenario" in firstAction))
      ) {
        parsed.aiInsight = null;
      }
    }
    return parsed;
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
  setResult: (result: DiagnosisResult | null) => void;
  setStatus: (status: DiagnosisStatus, error?: string | null) => void;
  setUserTypeOverride: (userType: UserType) => void;
  setSelectedActionCodes: (codes: string[]) => void;
  setEsgSurveyAnswers: (answers: EsgSurveyAnswers | null) => void;
  setXgboostResult: (result: XgboostDiagnoseResult | null) => void;
  setAiInsight: (result: AiInsightResult | null) => void;
  setRagCache: (
    cache: Record<string, { programs: unknown[]; defaultActions: unknown[] }>,
  ) => void;
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
      xgboostResult: state.xgboostResult,
      aiInsight: state.aiInsight,
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(persisted));
  }, [
    isHydrated,
    state.address,
    state.result,
    state.selectedActionCodes,
    state.esgSurveyAnswers,
    state.xgboostResult,
    state.aiInsight,
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
      setXgboostResult: (xgboostResult) =>
        setState((current) => ({ ...current, xgboostResult })),
      setAiInsight: (aiInsight) =>
        setState((current) => ({ ...current, aiInsight })),
      setRagCache: (ragCache) =>
        setState((current) => ({ ...current, ragCache })),
      reset: () => {
        window.localStorage.removeItem(STORAGE_KEY);
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
