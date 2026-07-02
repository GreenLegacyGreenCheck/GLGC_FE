import type { RecommendedActionView } from "@/context/diagnosis-context";
import {
  toEsgSurveyQuestions,
  type EsgSurveyQuestion,
  type RawEsgQuestionsByCategory,
} from "./esg-survey";
import type {
  DefaultActionSuggestion,
  SupportProgram,
} from "./support-programs";

export type CreateDiagnosisInput = {
  target: string;
  electricityRatio: number;
  gasRatio: number;
  targetEmissionKg: number;
  address?: string;
  usageKwh?: number;
  gasUsageMj?: number;
  billingMonth?: string;
};

type RawAction = {
  code: string;
  icon: string | null;
  title: string;
  description: string;
  difficulty: string;
  costLabel: string;
};

type RawRecommendedAction = {
  expectedMinKg: number;
  expectedMaxKg: number;
  action: RawAction;
};

type RawDiagnosis = {
  id: string;
  recommendedActions: RawRecommendedAction[];
};

export type DiagnosisDetail = {
  id: string;
  target: string;
  targetEmissionKg: number;
  address: string | null;
  usageKwh: number | null;
  gasUsageMj: number | null;
  billingMonth: string | null;
  createdAt: string;
};

function isDiagnosisDetail(value: unknown): value is DiagnosisDetail {
  if (typeof value !== "object" || value === null) return false;
  const detail = value as Record<string, unknown>;
  return (
    typeof detail.id === "string" &&
    typeof detail.target === "string" &&
    typeof detail.targetEmissionKg === "number" &&
    (detail.address === null || typeof detail.address === "string") &&
    (detail.usageKwh === null || typeof detail.usageKwh === "number") &&
    (detail.gasUsageMj === null || typeof detail.gasUsageMj === "number") &&
    (detail.billingMonth === null || typeof detail.billingMonth === "string") &&
    typeof detail.createdAt === "string"
  );
}

function isRawAction(value: unknown): value is RawAction {
  if (typeof value !== "object" || value === null) return false;
  const action = value as Record<string, unknown>;
  return (
    typeof action.code === "string" &&
    (action.icon === null || typeof action.icon === "string") &&
    typeof action.title === "string" &&
    typeof action.description === "string" &&
    typeof action.difficulty === "string" &&
    typeof action.costLabel === "string"
  );
}

function isRawRecommendedAction(value: unknown): value is RawRecommendedAction {
  if (typeof value !== "object" || value === null) return false;
  const recommended = value as Record<string, unknown>;
  return (
    typeof recommended.expectedMinKg === "number" &&
    typeof recommended.expectedMaxKg === "number" &&
    isRawAction(recommended.action)
  );
}

function isRawDiagnosis(value: unknown): value is RawDiagnosis {
  if (typeof value !== "object" || value === null) return false;
  const diagnosis = value as Record<string, unknown>;
  return (
    typeof diagnosis.id === "string" &&
    Array.isArray(diagnosis.recommendedActions) &&
    diagnosis.recommendedActions.every(isRawRecommendedAction)
  );
}

function toRecommendedActionView(
  raw: RawRecommendedAction,
): RecommendedActionView {
  return {
    code: raw.action.code,
    icon: raw.action.icon,
    title: raw.action.title,
    description: raw.action.description,
    difficulty: raw.action.difficulty,
    costLabel: raw.action.costLabel,
    expectedMinKg: raw.expectedMinKg,
    expectedMaxKg: raw.expectedMaxKg,
  };
}

function getBaseUrl(): string {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  if (!baseUrl) {
    throw new Error(
      "NEXT_PUBLIC_API_BASE_URL이 설정되지 않았습니다. .env.local을 확인해주세요.",
    );
  }

  return baseUrl;
}

export async function createDiagnosis(
  input: CreateDiagnosisInput,
  token?: string | null,
): Promise<{
  diagnosisId: string;
  recommendedActions: RecommendedActionView[];
}> {
  const baseUrl = getBaseUrl();

  const response = await fetch(`${baseUrl}/diagnosis`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(`진단 생성에 실패했습니다. (status: ${response.status})`);
  }

  const data: unknown = await response.json();

  if (!isRawDiagnosis(data)) {
    throw new Error("진단 응답 형식이 올바르지 않습니다.");
  }

  return {
    diagnosisId: data.id,
    recommendedActions: data.recommendedActions.map(toRecommendedActionView),
  };
}

export async function getDiagnosis(id: string): Promise<DiagnosisDetail> {
  const baseUrl = getBaseUrl();
  const response = await fetch(`${baseUrl}/diagnosis/${id}`);

  if (!response.ok) {
    throw new Error(
      `진단 결과를 불러오지 못했어요. (status: ${response.status})`,
    );
  }

  const data: unknown = await response.json();

  if (!isDiagnosisDetail(data)) {
    throw new Error("진단 응답 형식이 올바르지 않습니다.");
  }

  return data;
}

// 백엔드 RAG 응답의 실제 스키마
// { name, action_name, action_des, need, url, level, saving, ... }
type RawPolicyItem = {
  name: string;
  action_name: string;
  action_des: string;
  need: string;
  url: string;
  level: string;
  saving: string;
};

function isRawPolicyItem(value: unknown): value is RawPolicyItem {
  if (typeof value !== "object" || value === null) return false;
  const item = value as Record<string, unknown>;
  return typeof item.name === "string" && typeof item.url === "string";
}

type RawDefaultAction = {
  id: number;
  title: string;
  description: string;
  url: string;
};

function isRawDefaultAction(value: unknown): value is RawDefaultAction {
  if (typeof value !== "object" || value === null) return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.id === "number" &&
    typeof item.title === "string" &&
    typeof item.description === "string" &&
    typeof item.url === "string"
  );
}

export type ActionPolicyResult = {
  programs: SupportProgram[];
  defaultActions: DefaultActionSuggestion[];
};

// 정책 추천(RAG)은 외부 서비스라 액션 하나가 실패하거나 응답 형식이
// 예상과 다르더라도 나머지 선택된 액션의 결과는 보여줄 수 있어야 하므로,
// 던지지 않고 빈 결과로 처리한다.
export async function getActionPolicy(
  diagnosisId: string,
  actionCode: string,
  reason?: string,
): Promise<ActionPolicyResult> {
  const empty: ActionPolicyResult = { programs: [], defaultActions: [] };
  const baseUrl = getBaseUrl();

  let response: Response;

  try {
    response = await fetch(
      `${baseUrl}/diagnosis/${diagnosisId}/actions/${actionCode}/policy`,
      reason
        ? {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ reason }),
          }
        : undefined,
    );
  } catch {
    return empty;
  }

  if (!response.ok) {
    return empty;
  }

  const data: unknown = await response.json();

  if (typeof data !== "object" || data === null) {
    return empty;
  }

  const raw = data as Record<string, unknown>;
  // 새 스키마: { status, data: [...], total_count, ... }
  // 이전 스키마: { data: [...], default_actions: [...] } — 폴백 유지
  const rawPrograms = Array.isArray(raw.data) ? raw.data : [];

  const programs = rawPrograms.filter(isRawPolicyItem).map((item) => ({
    title: item.name,
    actionTitle: item.action_name ?? "",
    description: item.action_des ?? "",
    documents: item.need ?? "",
    link: item.url,
    difficulty: item.level ?? "",
    carbonSaving: item.saving ?? "",
  }));

  const rawDefaultActions = Array.isArray(raw.default_actions)
    ? raw.default_actions
    : [];
  const defaultActions = rawDefaultActions.filter(isRawDefaultAction);

  return { programs, defaultActions };
}

function isRawEsgQuestionItem(
  value: unknown,
): value is { code: string; question: string } {
  if (typeof value !== "object" || value === null) return false;
  const item = value as Record<string, unknown>;
  return typeof item.code === "string" && typeof item.question === "string";
}

function isRawEsgQuestionsByCategory(
  value: unknown,
): value is RawEsgQuestionsByCategory {
  if (typeof value !== "object" || value === null) return false;
  const categories = value as Record<string, unknown>;
  return (["E", "S", "G"] as const).every(
    (category) =>
      Array.isArray(categories[category]) &&
      categories[category].every(isRawEsgQuestionItem),
  );
}

export async function getEsgQuestions(): Promise<EsgSurveyQuestion[]> {
  const baseUrl = getBaseUrl();
  const response = await fetch(`${baseUrl}/esg-questions`);

  if (!response.ok) {
    throw new Error(
      `ESG 설문 문항을 불러오지 못했어요. (status: ${response.status})`,
    );
  }

  const data: unknown = await response.json();

  if (!isRawEsgQuestionsByCategory(data)) {
    throw new Error("ESG 설문 문항 응답 형식이 올바르지 않습니다.");
  }

  return toEsgSurveyQuestions(data);
}

export type XgboostDiagnoseInput = {
  elecKwh: number;
  gasMj?: number | null;
  deviceUsage?: Record<string, number> | null;
  esgAnswers?: Record<string, number> | null;
  // 직전 진단(로그인한 유저의 이력)에서 가져온 지난달 전기 사용량 — 있으면
  // monthly_comparison/trend_prediction이 실제 변화율 기반으로 계산된다.
  // 가스는 이력에 사용량을 저장해두지 않아 항상 null로 보낸다.
  prevElecKwh?: number | null;
};

export type XgboostDiagnoseResult = {
  energyGrade: {
    // 청구서 1건치(cause_analysis)가 아니라 연환산된 배출량 — 평균 비교/추세
    // 예측/절감 목표/절감 비용이 전부 이 스케일을 기준으로 계산돼 있어서,
    // 리포트 전체의 "연간 배출량" 기준값으로는 이 값을 쓴다.
    annualEmissionTons: number;
  };
  causeAnalysis: {
    // 이번에 올린 고지서 1건치 배출량(연환산 아님) — 에너지원별 배출 비중
    // 계산에만 쓰고, 화면에 "연간"으로 표시되는 숫자는 energyGrade를 쓴다.
    totalEmissionTons: number;
    elecRatioPercent: number;
    gasRatioPercent: number;
    // AI insight 호출 및 원인 분석(SHAP) 카드에서 사용
    rankedFactors: { factor: string; valuePercent: number; rank: number }[];
    comparisonMetrics: {
      elecVsAvgPercent: number;
      gasVsAvgPercent: number;
      coolingVsAvgPercent: number;
    };
  };
  averageComparison: {
    nationalAverageTons: number;
    industryAverageTons: number;
    diffVsNationalPercent: number;
    diffVsIndustryPercent: number;
    zScore: number;
    // 효율 기준 백분위로 가정한다(클수록 동종업 대비 적게 배출) — 실제 응답
    // 예시(배출량이 평균보다 훨씬 적은 케이스에서 89.3이 나옴)와 일치하는
    // 방향. API 문서에 정확한 정의가 없어 추정치임을 남겨둔다.
    rankPercentile: number;
  };
  monthlyComparison: {
    electricity: {
      previousKwh: number;
      currentKwh: number;
      changePercent: number;
    };
    carbonEmission: {
      previousTons: number;
      currentTons: number;
      changePercent: number;
    };
  } | null;
  trendPrediction: {
    predictedAnnualTons: number;
  };
  reductionGoal: {
    currentAnnualTons: number;
    targetAnnualTons: number;
    progressPercent: number;
  };
  costSaving: {
    currentAnnualCostKrw: number;
    expectedAnnualCostKrw: number;
    expectedSavingKrw: number;
  };
  esgScore: {
    e: {
      emissionScore: number | null;
      energyScore: number | null;
      surveyScore: number | null;
      finalScore: number | null;
    };
    s: number | null;
    g: number | null;
  };
};

type RawXgboostEsgCategoryE = {
  emission_score: number | null;
  energy_score: number | null;
  survey_score: number | null;
  final_score: number | null;
};

type RawKpi = {
  annual_emission_tco2: number;
};

type RawAverageComparison = {
  national_avg_tco2: number;
  industry_avg_tco2: number;
  diff_vs_national_percent: number;
  diff_vs_industry_percent: number;
  zscore: number;
  rank_percentile: number;
};

type RawMonthlyComparison = {
  electricity: {
    previous_kwh: number;
    current_kwh: number;
    change_percent: number;
  };
  carbon_emission: {
    previous_tco2: number;
    current_tco2: number;
    change_percent: number;
  };
};

type RawTrendPrediction = {
  keep_current: { predicted_annual_tco2: number };
};

type RawReductionGoal = {
  current_annual_tco2: number;
  target_annual_tco2: number;
  progress_percent: number;
};

type RawCostSaving = {
  current_annual_cost_krw: number;
  expected_annual_cost_krw: number;
  expected_saving_krw: number;
};

type RawXgboostDiagnoseResponse = {
  kpi: RawKpi;
  cause_analysis: {
    total_emission_tco2: number;
    by_energy_source: {
      electricity: { emission_tco2: number; ratio_percent: number };
      gas: { emission_tco2: number; ratio_percent: number };
    };
    ranked_factors?: { factor: string; value_percent: number; rank: number }[];
    comparison_metrics?: {
      elec_vs_avg_percent: number;
      gas_vs_avg_percent: number;
      cooling_vs_avg_percent: number;
    };
  };
  average_comparison: RawAverageComparison;
  monthly_comparison: RawMonthlyComparison | null;
  trend_prediction: RawTrendPrediction;
  reduction_goal: RawReductionGoal;
  cost_saving: RawCostSaving;
  esg_score: {
    E: RawXgboostEsgCategoryE;
    S: number | null;
    G: number | null;
  };
};

function isOptionalNullableNumber(value: unknown): value is number | null {
  return value === null || typeof value === "number";
}

function isRawXgboostEsgCategoryE(
  value: unknown,
): value is RawXgboostEsgCategoryE {
  if (typeof value !== "object" || value === null) return false;
  const item = value as Record<string, unknown>;
  return (
    isOptionalNullableNumber(item.emission_score) &&
    isOptionalNullableNumber(item.energy_score) &&
    isOptionalNullableNumber(item.survey_score) &&
    isOptionalNullableNumber(item.final_score)
  );
}

function isRawEnergySourceBreakdown(
  value: unknown,
): value is { emission_tco2: number; ratio_percent: number } {
  if (typeof value !== "object" || value === null) return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.emission_tco2 === "number" &&
    typeof item.ratio_percent === "number"
  );
}

function isRawKpi(value: unknown): value is RawKpi {
  if (typeof value !== "object" || value === null) return false;
  return (
    typeof (value as Record<string, unknown>).annual_emission_tco2 === "number"
  );
}

function isRawAverageComparison(value: unknown): value is RawAverageComparison {
  if (typeof value !== "object" || value === null) return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.national_avg_tco2 === "number" &&
    typeof item.industry_avg_tco2 === "number" &&
    typeof item.diff_vs_national_percent === "number" &&
    typeof item.diff_vs_industry_percent === "number" &&
    typeof item.zscore === "number" &&
    typeof item.rank_percentile === "number"
  );
}

function isRawMonthlyComparison(value: unknown): value is RawMonthlyComparison {
  if (typeof value !== "object" || value === null) return false;
  const item = value as Record<string, unknown>;
  const electricity = item.electricity as Record<string, unknown> | undefined;
  const carbon = item.carbon_emission as Record<string, unknown> | undefined;
  return (
    typeof electricity === "object" &&
    electricity !== null &&
    typeof electricity.previous_kwh === "number" &&
    typeof electricity.current_kwh === "number" &&
    typeof electricity.change_percent === "number" &&
    typeof carbon === "object" &&
    carbon !== null &&
    typeof carbon.previous_tco2 === "number" &&
    typeof carbon.current_tco2 === "number" &&
    typeof carbon.change_percent === "number"
  );
}

function isRawTrendPrediction(value: unknown): value is RawTrendPrediction {
  if (typeof value !== "object" || value === null) return false;
  const keepCurrent = (value as Record<string, unknown>).keep_current;
  if (typeof keepCurrent !== "object" || keepCurrent === null) return false;
  return (
    typeof (keepCurrent as Record<string, unknown>).predicted_annual_tco2 ===
    "number"
  );
}

function isRawReductionGoal(value: unknown): value is RawReductionGoal {
  if (typeof value !== "object" || value === null) return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.current_annual_tco2 === "number" &&
    typeof item.target_annual_tco2 === "number" &&
    typeof item.progress_percent === "number"
  );
}

function isRawCostSaving(value: unknown): value is RawCostSaving {
  if (typeof value !== "object" || value === null) return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.current_annual_cost_krw === "number" &&
    typeof item.expected_annual_cost_krw === "number" &&
    typeof item.expected_saving_krw === "number"
  );
}

// XGBoost 서비스의 응답 스펙은 아직 자주 바뀐다(이미 한 번 cause_analysis가
// 평평한 구조에서 by_energy_source 중첩 구조로 바뀌었다) — 우리가 실제로
// 쓰는 필드만 좁게 검증하고, 모르는 필드가 추가되는 건 무시한다.
function isRawXgboostDiagnoseResponse(
  value: unknown,
): value is RawXgboostDiagnoseResponse {
  if (typeof value !== "object" || value === null) return false;
  const response = value as Record<string, unknown>;
  const cause = response.cause_analysis as Record<string, unknown> | undefined;
  const esg = response.esg_score as Record<string, unknown> | undefined;

  if (typeof cause !== "object" || cause === null) return false;
  if (typeof esg !== "object" || esg === null) return false;

  const bySource = cause.by_energy_source as
    | Record<string, unknown>
    | undefined;

  return (
    typeof cause.total_emission_tco2 === "number" &&
    typeof bySource === "object" &&
    bySource !== null &&
    isRawEnergySourceBreakdown(bySource.electricity) &&
    isRawEnergySourceBreakdown(bySource.gas) &&
    isRawXgboostEsgCategoryE(esg.E) &&
    isOptionalNullableNumber(esg.S) &&
    isOptionalNullableNumber(esg.G) &&
    isRawKpi(response.kpi) &&
    isRawAverageComparison(response.average_comparison) &&
    (response.monthly_comparison === null ||
      isRawMonthlyComparison(response.monthly_comparison)) &&
    isRawTrendPrediction(response.trend_prediction) &&
    isRawReductionGoal(response.reduction_goal) &&
    isRawCostSaving(response.cost_saving)
  );
}

// 원인 분석 + ESG 점수 계산 — 백엔드가 XGBoost 서비스(POST /xgboost-diagnose)를
// 그대로 통과시킨다. elec_kwh를 제외한 나머지는 전부 optional/nullable이라
// 가스 고지서가 없거나 ESG 설문을 못 받아온 경우에도 호출할 수 있다.
export async function diagnoseWithXgboost(
  input: XgboostDiagnoseInput,
): Promise<XgboostDiagnoseResult> {
  const baseUrl = getBaseUrl();

  const response = await fetch(`${baseUrl}/xgboost-diagnose`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      elec_kwh: input.elecKwh,
      gas_mj: input.gasMj ?? null,
      device_usage: input.deviceUsage ?? {},
      esg_answers: input.esgAnswers ?? null,
      prev_elec_kwh: input.prevElecKwh ?? null,
      prev_gas_mj: null,
    }),
  });

  if (!response.ok) {
    throw new Error(`원인 분석에 실패했어요. (status: ${response.status})`);
  }

  const data: unknown = await response.json();

  if (!isRawXgboostDiagnoseResponse(data)) {
    throw new Error("원인 분석 응답 형식이 올바르지 않습니다.");
  }

  return {
    energyGrade: {
      annualEmissionTons: data.kpi.annual_emission_tco2,
    },
    causeAnalysis: {
      totalEmissionTons: data.cause_analysis.total_emission_tco2,
      elecRatioPercent:
        data.cause_analysis.by_energy_source.electricity.ratio_percent,
      gasRatioPercent: data.cause_analysis.by_energy_source.gas.ratio_percent,
      rankedFactors: (data.cause_analysis.ranked_factors ?? []).map((f) => ({
        factor: f.factor,
        valuePercent: f.value_percent,
        rank: f.rank,
      })),
      comparisonMetrics: {
        elecVsAvgPercent:
          data.cause_analysis.comparison_metrics?.elec_vs_avg_percent ?? 0,
        gasVsAvgPercent:
          data.cause_analysis.comparison_metrics?.gas_vs_avg_percent ?? 0,
        coolingVsAvgPercent:
          data.cause_analysis.comparison_metrics?.cooling_vs_avg_percent ?? 0,
      },
    },
    averageComparison: {
      nationalAverageTons: data.average_comparison.national_avg_tco2,
      industryAverageTons: data.average_comparison.industry_avg_tco2,
      diffVsNationalPercent: data.average_comparison.diff_vs_national_percent,
      diffVsIndustryPercent: data.average_comparison.diff_vs_industry_percent,
      zScore: data.average_comparison.zscore,
      rankPercentile: data.average_comparison.rank_percentile,
    },
    monthlyComparison: data.monthly_comparison
      ? {
          electricity: {
            previousKwh: data.monthly_comparison.electricity.previous_kwh,
            currentKwh: data.monthly_comparison.electricity.current_kwh,
            changePercent: data.monthly_comparison.electricity.change_percent,
          },
          carbonEmission: {
            previousTons: data.monthly_comparison.carbon_emission.previous_tco2,
            currentTons: data.monthly_comparison.carbon_emission.current_tco2,
            changePercent:
              data.monthly_comparison.carbon_emission.change_percent,
          },
        }
      : null,
    trendPrediction: {
      predictedAnnualTons:
        data.trend_prediction.keep_current.predicted_annual_tco2,
    },
    reductionGoal: {
      currentAnnualTons: data.reduction_goal.current_annual_tco2,
      targetAnnualTons: data.reduction_goal.target_annual_tco2,
      progressPercent: data.reduction_goal.progress_percent,
    },
    costSaving: {
      currentAnnualCostKrw: data.cost_saving.current_annual_cost_krw,
      expectedAnnualCostKrw: data.cost_saving.expected_annual_cost_krw,
      expectedSavingKrw: data.cost_saving.expected_saving_krw,
    },
    esgScore: {
      e: {
        emissionScore: data.esg_score.E.emission_score,
        energyScore: data.esg_score.E.energy_score,
        surveyScore: data.esg_score.E.survey_score,
        finalScore: data.esg_score.E.final_score,
      },
      s: data.esg_score.S,
      g: data.esg_score.G,
    },
  };
}
