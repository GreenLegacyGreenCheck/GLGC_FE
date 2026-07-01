import type { XgboostDiagnoseResult } from "./diagnosis-api";
import type { AiInsightResult } from "@/context/diagnosis-context";

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

function isAiInsightResult(value: unknown): value is AiInsightResult {
  if (typeof value !== "object" || value === null) return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.aiSummary === "string" &&
    Array.isArray(item.aiEvidenceBullets) &&
    Array.isArray(item.actions) &&
    item.actions.every(isAiAction)
  );
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
// 생성한다. 액션은 Gemini가 에너지 데이터를 직접 추론해 생성하므로 백엔드의
// recommendedActions에 의존하지 않는다.
export async function getAiInsight(
  xgboost: XgboostDiagnoseResult,
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
      rankPercentile: xgboost.averageComparison.rankPercentile,
      rankedFactors: xgboost.causeAnalysis.rankedFactors,
      comparisonMetrics: xgboost.causeAnalysis.comparisonMetrics,
    }),
  });

  if (!response.ok) {
    throw new Error(
      `AI 인사이트 요청이 실패했어요. (status: ${response.status})`,
    );
  }

  const data: unknown = await response.json();

  if (!isAiInsightResult(data)) {
    throw new Error("AI 인사이트 응답 형식이 올바르지 않습니다.");
  }

  return data;
}
