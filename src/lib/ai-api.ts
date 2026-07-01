import type { XgboostDiagnoseResult } from "./diagnosis-api";
import type {
  AiInsightResult,
  RecommendedActionView,
} from "@/context/diagnosis-context";

export type { AiInsightResult };

// 필드가 없거나 null/undefined여도 기본값으로 정규화한다.
// 백엔드가 snake_case로 보낼 수도 있으므로 두 형태 모두 읽는다.
function normalizeAction(
  raw: unknown,
): AiInsightResult["actions"][number] | null {
  if (typeof raw !== "object" || raw === null) return null;
  const item = raw as Record<string, unknown>;

  const code = item.code;
  const title = item.title;
  if (typeof code !== "string" || typeof title !== "string") return null;

  return {
    code,
    icon: typeof item.icon === "string" ? item.icon : null,
    title,
    description: typeof item.description === "string" ? item.description : "",
    difficulty: typeof item.difficulty === "string" ? item.difficulty : "중간",
    costLabel:
      typeof item.costLabel === "string"
        ? item.costLabel
        : typeof item.cost_label === "string"
          ? item.cost_label
          : "",
    expectedMinKg:
      typeof item.expectedMinKg === "number"
        ? item.expectedMinKg
        : typeof item.expected_min_kg === "number"
          ? item.expected_min_kg
          : 0,
    expectedMaxKg:
      typeof item.expectedMaxKg === "number"
        ? item.expectedMaxKg
        : typeof item.expected_max_kg === "number"
          ? item.expected_max_kg
          : 0,
    reason: typeof item.reason === "string" ? item.reason : "",
    scenario: (() => {
      const s = item.scenario;
      if (typeof s !== "object" || s === null) return null;
      const sc = s as Record<string, unknown>;
      return {
        beforeText: typeof sc.beforeText === "string" ? sc.beforeText : "",
        afterText: typeof sc.afterText === "string" ? sc.afterText : "",
        reductionGoalText:
          typeof sc.reductionGoalText === "string" ? sc.reductionGoalText : "",
        costSavingText:
          typeof sc.costSavingText === "string" ? sc.costSavingText : "",
        evidenceText:
          typeof sc.evidenceText === "string" ? sc.evidenceText : "",
      };
    })(),
  };
}

// 백엔드가 새 포맷(actions[])을 반환하면 그대로 쓰고,
// 구버전 포맷(actionReasons: Record)이면 actions를 빈 배열로 정규화한다.
function normalizeAiInsight(value: unknown): AiInsightResult | null {
  if (typeof value !== "object" || value === null) return null;
  const item = value as Record<string, unknown>;
  if (typeof item.aiSummary !== "string") return null;
  if (!Array.isArray(item.aiEvidenceBullets)) return null;

  const actions: AiInsightResult["actions"] = Array.isArray(item.actions)
    ? item.actions.reduce<AiInsightResult["actions"]>((acc, raw) => {
        const normalized = normalizeAction(raw);
        if (normalized) acc.push(normalized);
        return acc;
      }, [])
    : [];

  return {
    aiSummary: item.aiSummary,
    aiEvidenceBullets: item.aiEvidenceBullets as {
      text: string;
      isPositive: boolean;
    }[],
    actions,
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

// XGBoost 분석 결과를 Gemini에 전달해 리포트 요약, 근거 문장, 개인화 감축 액션을
// 생성한다. 백엔드가 업데이트되면 actions[]를 반환하고, 아직 구버전이면
// actions는 빈 배열로 처리해 폴백 UI가 동작한다.
export async function getAiInsight(
  xgboost: XgboostDiagnoseResult,
  actions: RecommendedActionView[] = [],
): Promise<AiInsightResult> {
  const baseUrl = getBaseUrl();

  const response = await fetch(`${baseUrl}/ai/insight`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      annualEmissionTons: xgboost.energyGrade.annualEmissionTons,
      grade: (() => {
        const t = xgboost.energyGrade.annualEmissionTons;
        if (t <= 1.5) return "A";
        if (t <= 2.3) return "B";
        if (t <= 3.0) return "C";
        if (t <= 4.0) return "D";
        return "E";
      })(),
      elecRatioPercent: xgboost.causeAnalysis.elecRatioPercent,
      gasRatioPercent: xgboost.causeAnalysis.gasRatioPercent,
      diffVsNationalPercent: xgboost.averageComparison.diffVsNationalPercent,
      diffVsIndustryPercent: xgboost.averageComparison.diffVsIndustryPercent,
      rankedFactors: xgboost.causeAnalysis.rankedFactors,
      // 기존 백엔드 호환: 추천 액션 코드 목록을 hint로 함께 전달한다.
      // 백엔드가 업데이트되면 이 필드를 사용해 액션을 Gemini가 생성한다.
      actions: actions.map((a) => ({ code: a.code, title: a.title })),
    }),
  });

  if (!response.ok) {
    throw new Error(
      `AI 인사이트 요청이 실패했어요. (status: ${response.status})`,
    );
  }

  const data: unknown = await response.json();
  const normalized = normalizeAiInsight(data);

  if (!normalized) {
    throw new Error("AI 인사이트 응답 형식이 올바르지 않습니다.");
  }

  return normalized;
}
