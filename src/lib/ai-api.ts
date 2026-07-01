import type { XgboostDiagnoseResult } from "./diagnosis-api";
import type {
  AiInsightResult,
  RecommendedActionView,
} from "@/context/diagnosis-context";

export type { AiInsightResult };

function isAiAction(value: unknown): boolean {
  if (typeof value !== "object" || value === null) return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.code === "string" &&
    (item.icon === null || typeof item.icon === "string") &&
    typeof item.title === "string" &&
    typeof item.description === "string" &&
    typeof item.difficulty === "string" &&
    typeof item.costLabel === "string" &&
    typeof item.expectedMinKg === "number" &&
    typeof item.expectedMaxKg === "number" &&
    typeof item.reason === "string"
  );
}

// 백엔드가 새 포맷(actions[])을 반환하면 그대로 쓰고,
// 구버전 포맷(actionReasons: Record)이면 actions를 빈 배열로 정규화한다.
function normalizeAiInsight(value: unknown): AiInsightResult | null {
  if (typeof value !== "object" || value === null) return null;
  const item = value as Record<string, unknown>;
  if (typeof item.aiSummary !== "string") return null;
  if (!Array.isArray(item.aiEvidenceBullets)) return null;

  const actions = Array.isArray(item.actions)
    ? (item.actions.filter(isAiAction) as AiInsightResult["actions"])
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
