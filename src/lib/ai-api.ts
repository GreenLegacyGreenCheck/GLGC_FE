import type { XgboostDiagnoseResult } from "./diagnosis-api";
import type {
  AiInsightResult,
  RecommendedActionView,
} from "@/context/diagnosis-context";

export type { AiInsightResult };

function isAiInsightResult(value: unknown): value is AiInsightResult {
  if (typeof value !== "object" || value === null) return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.aiSummary === "string" &&
    Array.isArray(item.aiEvidenceBullets) &&
    typeof item.actionReasons === "object" &&
    item.actionReasons !== null
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

export async function getAiInsight(
  xgboost: XgboostDiagnoseResult,
  actions: RecommendedActionView[],
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
      actions: actions.map((a) => ({ code: a.code, title: a.title })),
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
