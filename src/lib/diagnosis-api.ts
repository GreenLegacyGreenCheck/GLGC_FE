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

// XGBoost 응답 스펙이 자주 바뀌므로 strict validator 대신 lenient 정규화로
// 처리한다. 핵심 필드(kpi.annual_emission_tco2, cause_analysis)만 필수로
// 확인하고, 나머지는 없으면 안전한 기본값으로 채운다.
function normalizeXgboostResponse(raw: unknown): XgboostDiagnoseResult | null {
  if (typeof raw !== "object" || raw === null) return null;
  const r = raw as Record<string, unknown>;

  // 필수: kpi 또는 energy_grade 에서 연간 배출량
  const kpi = r.kpi as Record<string, unknown> | undefined;
  const annualTco2 =
    typeof kpi?.annual_emission_tco2 === "number"
      ? kpi.annual_emission_tco2
      : 0;

  // cause_analysis
  const cause = r.cause_analysis as Record<string, unknown> | undefined;
  if (typeof cause !== "object" || cause === null) return null;
  const bySource = cause.by_energy_source as
    | Record<string, unknown>
    | undefined;
  const elecSource = bySource?.electricity as
    | Record<string, unknown>
    | undefined;
  const gasSource = bySource?.gas as Record<string, unknown> | undefined;
  const totalTco2 =
    typeof cause.total_emission_tco2 === "number"
      ? cause.total_emission_tco2
      : annualTco2;
  const elecRatio =
    typeof elecSource?.ratio_percent === "number"
      ? elecSource.ratio_percent
      : 100;
  const gasRatio =
    typeof gasSource?.ratio_percent === "number" ? gasSource.ratio_percent : 0;
  const compMetrics = cause.comparison_metrics as
    | Record<string, unknown>
    | undefined;
  const rankedFactors = Array.isArray(cause.ranked_factors)
    ? (cause.ranked_factors as {
        factor: string;
        value_percent: number;
        rank: number;
      }[])
    : [];

  // average_comparison
  const avg = r.average_comparison as Record<string, unknown> | undefined;
  const nationalAvg =
    typeof avg?.national_avg_tco2 === "number" ? avg.national_avg_tco2 : 0;
  const industryAvg =
    typeof avg?.industry_avg_tco2 === "number" ? avg.industry_avg_tco2 : 0;
  const diffNational =
    typeof avg?.diff_vs_national_percent === "number"
      ? avg.diff_vs_national_percent
      : 0;
  const diffIndustry =
    typeof avg?.diff_vs_industry_percent === "number"
      ? avg.diff_vs_industry_percent
      : 0;
  const zScore = typeof avg?.zscore === "number" ? avg.zscore : 0;
  const rankPercentile =
    typeof avg?.rank_percentile === "number" ? avg.rank_percentile : 0;

  // monthly_comparison (optional)
  let monthlyComparison: XgboostDiagnoseResult["monthlyComparison"] = null;
  const mc = r.monthly_comparison as Record<string, unknown> | null | undefined;
  if (mc && typeof mc === "object") {
    const elec = mc.electricity as Record<string, unknown> | undefined;
    const carbon = mc.carbon_emission as Record<string, unknown> | undefined;
    if (
      elec &&
      carbon &&
      typeof elec.previous_kwh === "number" &&
      typeof elec.current_kwh === "number"
    ) {
      monthlyComparison = {
        electricity: {
          previousKwh: elec.previous_kwh as number,
          currentKwh: elec.current_kwh as number,
          changePercent:
            typeof elec.change_percent === "number"
              ? (elec.change_percent as number)
              : 0,
        },
        carbonEmission: {
          previousTons:
            typeof carbon.previous_tco2 === "number"
              ? (carbon.previous_tco2 as number)
              : 0,
          currentTons:
            typeof carbon.current_tco2 === "number"
              ? (carbon.current_tco2 as number)
              : 0,
          changePercent:
            typeof carbon.change_percent === "number"
              ? (carbon.change_percent as number)
              : 0,
        },
      };
    }
  }

  // trend_prediction — 신형: predicted_annual_tco2 직접 / 구형: keep_current.predicted_annual_tco2
  const trend = r.trend_prediction as Record<string, unknown> | undefined;
  const keepCurrent = trend?.keep_current as
    | Record<string, unknown>
    | undefined;
  const predictedTco2 =
    typeof trend?.predicted_annual_tco2 === "number"
      ? (trend.predicted_annual_tco2 as number)
      : typeof keepCurrent?.predicted_annual_tco2 === "number"
        ? (keepCurrent.predicted_annual_tco2 as number)
        : annualTco2;

  // reduction_goal — 신형: current_grade/remaining만 있고 tco2 없는 경우도 처리
  const goal = r.reduction_goal as Record<string, unknown> | undefined;
  const currentGoalTco2 =
    typeof goal?.current_annual_tco2 === "number"
      ? (goal.current_annual_tco2 as number)
      : annualTco2;
  const remaining =
    typeof goal?.remaining_reduction_tco2 === "number"
      ? (goal.remaining_reduction_tco2 as number)
      : 0;
  const targetGoalTco2 =
    typeof goal?.target_annual_tco2 === "number"
      ? (goal.target_annual_tco2 as number)
      : remaining === 0
        ? currentGoalTco2
        : currentGoalTco2 - remaining;
  const progressPercent =
    typeof goal?.progress_percent === "number"
      ? (goal.progress_percent as number)
      : remaining === 0
        ? 100
        : currentGoalTco2 > 0
          ? Math.round(((currentGoalTco2 - remaining) / currentGoalTco2) * 100)
          : 100;

  // cost_saving
  const cost = r.cost_saving as Record<string, unknown> | undefined;
  const currentCostKrw =
    typeof cost?.current_annual_cost_krw === "number"
      ? (cost.current_annual_cost_krw as number)
      : 0;
  const savingKrw =
    typeof cost?.expected_saving_krw === "number"
      ? (cost.expected_saving_krw as number)
      : 0;
  const expectedCostKrw =
    typeof cost?.expected_annual_cost_krw === "number"
      ? (cost.expected_annual_cost_krw as number)
      : currentCostKrw - savingKrw;

  // esg_score (optional — 없으면 전부 null)
  const esg = r.esg_score as Record<string, unknown> | undefined;
  const esgE = esg?.E as Record<string, unknown> | undefined;

  return {
    energyGrade: { annualEmissionTons: annualTco2 },
    causeAnalysis: {
      totalEmissionTons: totalTco2,
      elecRatioPercent: elecRatio,
      gasRatioPercent: gasRatio,
      rankedFactors: rankedFactors.map((f) => ({
        factor: f.factor,
        valuePercent: f.value_percent,
        rank: f.rank,
      })),
      comparisonMetrics: {
        elecVsAvgPercent:
          typeof compMetrics?.elec_vs_avg_percent === "number"
            ? (compMetrics.elec_vs_avg_percent as number)
            : 0,
        gasVsAvgPercent:
          typeof compMetrics?.gas_vs_avg_percent === "number"
            ? (compMetrics.gas_vs_avg_percent as number)
            : 0,
        coolingVsAvgPercent:
          typeof compMetrics?.cooling_vs_avg_percent === "number"
            ? (compMetrics.cooling_vs_avg_percent as number)
            : 0,
      },
    },
    averageComparison: {
      nationalAverageTons: nationalAvg,
      industryAverageTons: industryAvg,
      diffVsNationalPercent: diffNational,
      diffVsIndustryPercent: diffIndustry,
      zScore,
      rankPercentile,
    },
    monthlyComparison,
    trendPrediction: { predictedAnnualTons: predictedTco2 },
    reductionGoal: {
      currentAnnualTons: currentGoalTco2,
      targetAnnualTons: targetGoalTco2,
      progressPercent,
    },
    costSaving: {
      currentAnnualCostKrw: currentCostKrw,
      expectedAnnualCostKrw: expectedCostKrw,
      expectedSavingKrw: savingKrw,
    },
    esgScore: {
      e: {
        emissionScore:
          typeof esgE?.emission_score === "number"
            ? (esgE.emission_score as number)
            : null,
        energyScore:
          typeof esgE?.energy_score === "number"
            ? (esgE.energy_score as number)
            : null,
        surveyScore:
          typeof esgE?.survey_score === "number"
            ? (esgE.survey_score as number)
            : null,
        finalScore:
          typeof esgE?.final_score === "number"
            ? (esgE.final_score as number)
            : null,
      },
      s: typeof esg?.S === "number" ? (esg.S as number) : null,
      g: typeof esg?.G === "number" ? (esg.G as number) : null,
    },
  };
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
