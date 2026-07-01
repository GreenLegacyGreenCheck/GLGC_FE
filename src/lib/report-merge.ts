import { BoltIcon, FireIcon, SwirlIcon } from "@/components/icons";
import type { XgboostDiagnoseResult } from "@/lib/diagnosis-api";
import {
  DUMMY_REPORT,
  getGradeInfo,
  type DiagnosisReportData,
  type EmissionTreeNode,
  type EnergyBreakdownItem,
  type MonthOverMonthMetric,
} from "@/lib/report-data";

function buildEnergyBreakdown(
  causeAnalysis: XgboostDiagnoseResult["causeAnalysis"],
  annualEmissionTons: number,
): EnergyBreakdownItem[] {
  const { elecRatioPercent, gasRatioPercent } = causeAnalysis;
  return [
    {
      label: "전기",
      icon: BoltIcon,
      iconColorClass: "text-[#facc15]",
      co2Tons:
        Math.round(annualEmissionTons * (elecRatioPercent / 100) * 100) / 100,
      percentage: Math.round(elecRatioPercent),
      barColorClass: "bg-[#1ba77d]",
    },
    {
      label: "가스",
      icon: FireIcon,
      iconColorClass: "text-[#e0763a]",
      co2Tons:
        Math.round(annualEmissionTons * (gasRatioPercent / 100) * 100) / 100,
      percentage: Math.round(gasRatioPercent),
      barColorClass: "bg-[#e0a23a]",
    },
  ];
}

function buildEmissionTree(
  causeAnalysis: XgboostDiagnoseResult["causeAnalysis"],
): EmissionTreeNode {
  return {
    id: "root",
    label: "총 배출량",
    percentage: 100,
    children: [
      {
        id: "electricity",
        label: "전기",
        percentage: Math.round(causeAnalysis.elecRatioPercent),
      },
      {
        id: "gas",
        label: "가스",
        percentage: Math.round(causeAnalysis.gasRatioPercent),
      },
    ],
  };
}

function toManwonLabel(krw: number): string {
  return `${Math.round(krw / 10000)}만원`;
}

function monthOverMonthAccent(isIncrease: boolean) {
  return isIncrease
    ? {
        accentBorderClass: "border-[#f1c9a6]",
        accentTextClass: "text-[#e0a23a]",
        accentBgClass: "bg-[#e0a23a]",
      }
    : {
        accentBorderClass: "border-[#bfe9da]",
        accentTextClass: "text-[#1ba77d]",
        accentBgClass: "bg-[#1ba77d]",
      };
}

function buildMonthOverMonth(
  monthlyComparison: NonNullable<XgboostDiagnoseResult["monthlyComparison"]>,
): MonthOverMonthMetric[] {
  const { electricity, carbonEmission } = monthlyComparison;
  const elecIncrease = electricity.changePercent > 0;
  const carbonIncrease = carbonEmission.changePercent > 0;
  return [
    {
      label: "전기",
      icon: BoltIcon,
      iconColorClass: "text-[#facc15]",
      unit: "kWh",
      previousValue: electricity.previousKwh,
      currentValue: electricity.currentKwh,
      percentChange: Math.round(Math.abs(electricity.changePercent) * 10) / 10,
      isIncrease: elecIncrease,
      ...monthOverMonthAccent(elecIncrease),
    },
    {
      label: "탄소배출량",
      icon: SwirlIcon,
      iconColorClass: "text-[#6b7785]",
      unit: "tCO₂e",
      previousValue: carbonEmission.previousTons,
      currentValue: carbonEmission.currentTons,
      percentChange:
        Math.round(Math.abs(carbonEmission.changePercent) * 10) / 10,
      isIncrease: carbonIncrease,
      ...monthOverMonthAccent(carbonIncrease),
    },
  ];
}

export type AiOverlay = {
  aiSummary: string;
  aiEvidenceBullets: { text: string; isPositive: boolean }[];
  aiActionReasons: Record<string, string>;
};

// XGBoost 결과를 기본 더미 리포트 위에 덮어씌워 실데이터 리포트를 만든다.
// /report(오늘 진단)와 /mypage/reports/[id](이력 상세) 양쪽에서 공유한다.
// aiOverlay가 있으면 AI 종합 의견 + 원인 분석 근거도 실데이터로 채운다.
export function mergeXgboostResult(
  base: DiagnosisReportData,
  xgboost: XgboostDiagnoseResult,
  hasEsgAnswers: boolean,
  aiOverlay?: AiOverlay,
): DiagnosisReportData {
  const {
    energyGrade,
    causeAnalysis,
    averageComparison,
    monthlyComparison,
    trendPrediction,
    reductionGoal,
    costSaving,
    esgScore,
  } = xgboost;

  const annualCo2Tons = Math.round(energyGrade.annualEmissionTons * 100) / 100;
  const { grade, gradeColorClass } = getGradeInfo(annualCo2Tons);

  const isAboveIndustryAvg = averageComparison.diffVsIndustryPercent >= 0;
  const percentileMessage = isAboveIndustryAvg
    ? `동종업 대비 배출량이 많아요. 효율 순위 하위 ${Math.round(100 - averageComparison.rankPercentile)}%에 해당해요. 감축 액션이 필요해요.`
    : `동종업 대비 배출량이 적어요. 효율 순위 상위 ${Math.round(averageComparison.rankPercentile)}%에 해당해요. 현재 수준을 잘 유지해보세요.`;

  const predictedTons =
    Math.round(trendPrediction.predictedAnnualTons * 100) / 100;
  const predictedGradeInfo = getGradeInfo(predictedTons);

  const merged: DiagnosisReportData = {
    ...base,
    annualCo2Tons,
    grade,
    gradeColorClass,
    comparisonLabel: "전국 소상공인 평균 대비",
    comparisonPercent:
      Math.round(averageComparison.diffVsNationalPercent * 10) / 10,
    nationalAverageTons:
      Math.round(averageComparison.nationalAverageTons * 100) / 100,
    industryAverageTons:
      Math.round(averageComparison.industryAverageTons * 100) / 100,
    ourUsageTons: annualCo2Tons,
    zScore: Math.round(averageComparison.zScore * 100) / 100,
    percentile: Math.round(averageComparison.rankPercentile),
    percentileMessage,
    energyBreakdown: buildEnergyBreakdown(causeAnalysis, annualCo2Tons),
    emissionTree: buildEmissionTree(causeAnalysis),
    trendScenarios: [
      {
        label: "현재 추세 유지 시",
        months: 3,
        projectedTons: predictedTons,
        projectedGrade: predictedGradeInfo.grade,
        projectedGradeColorClass: predictedGradeInfo.gradeColorClass,
        isWarning: predictedTons > annualCo2Tons,
      },
    ],
    goal: {
      currentTons: Math.round(reductionGoal.currentAnnualTons * 100) / 100,
      targetTons: Math.round(reductionGoal.targetAnnualTons * 100) / 100,
      progressPercent: Math.round(reductionGoal.progressPercent),
    },
    costSavings: {
      label: "예상 에너지 요금",
      unitLabel: "/ 년",
      currentAnnualCostLabel: toManwonLabel(costSaving.currentAnnualCostKrw),
      projectedAnnualCostLabel: toManwonLabel(costSaving.expectedAnnualCostKrw),
      annualSavingsLabel: `연간 약 ${toManwonLabel(costSaving.expectedSavingKrw)} 절감`,
    },
  };

  // ranked_factors → emissionCauses (SHAP 순위별 요인)
  if (causeAnalysis.rankedFactors.length > 0) {
    merged.emissionCauses = causeAnalysis.rankedFactors.map((f) => ({
      rank: f.rank,
      label: f.factor,
      percentChange: Math.round(Math.abs(f.valuePercent) * 10) / 10,
    }));
  }

  // AI 인사이트가 있으면 aiSummary와 aiEvidenceBullets를 덮어쓴다
  if (aiOverlay) {
    if (aiOverlay.aiSummary) {
      merged.aiSummary = [{ text: aiOverlay.aiSummary }];
    }
    if (aiOverlay.aiEvidenceBullets.length > 0) {
      merged.aiEvidenceBullets = aiOverlay.aiEvidenceBullets;
    }
  }

  // 이전 달 데이터가 없으면 더미 값이 화면에 노출되지 않도록 빈 배열로 덮는다.
  merged.monthOverMonth = monthlyComparison
    ? buildMonthOverMonth(monthlyComparison)
    : [];

  if (hasEsgAnswers && esgScore.s !== null && esgScore.g !== null) {
    const eScore = Math.round(esgScore.e.finalScore ?? 0);
    const sScore = Math.round(esgScore.s);
    const gScore = Math.round(esgScore.g);
    const overallScore = (eScore + sScore + gScore) / 3;
    merged.esgScores = [
      { label: "환경(E)", score: eScore, ringColorHex: "#1ba77d" },
      { label: "사회(S)", score: sScore, ringColorHex: "#3b82f6" },
      { label: "거버넌스(G)", score: gScore, ringColorHex: "#8b5cf6" },
    ];
    merged.esgStatusLabel =
      overallScore >= 70 ? "양호" : overallScore >= 40 ? "보통" : "개선 필요";
  }

  return merged;
}

// XGBoost 호출이 실패했을 때의 최소 더미 오버레이 — 저장된 값(targetEmissionKg)
// 기반으로 KPI/등급/우리 가게 막대만 실데이터로 채운다.
export function buildFallbackReport(
  targetEmissionKg: number,
): DiagnosisReportData {
  const annualCo2Tons = Math.round((targetEmissionKg / 1000) * 100) / 100;
  const { grade, gradeColorClass } = getGradeInfo(annualCo2Tons);
  return {
    ...DUMMY_REPORT,
    grade,
    gradeColorClass,
    annualCo2Tons,
    ourUsageTons: annualCo2Tons,
    goal: { ...DUMMY_REPORT.goal, currentTons: annualCo2Tons },
  };
}
