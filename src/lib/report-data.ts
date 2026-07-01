import { BoltIcon, FireIcon, SwirlIcon } from "@/components/icons";
import type { ComponentType } from "react";

// Dummy report content matching the current report design. Once the
// backend can return an AI-generated diagnosis, this should be replaced
// by a GET response instead of a static constant.
export type EnergyBreakdownItem = {
  label: string;
  icon: ComponentType<{ className?: string }>;
  iconColorClass: string;
  co2Tons: number;
  percentage: number;
  barColorClass: string;
};

export type EsgScoreItem = {
  label: string;
  score: number;
  ringColorHex: string;
};

export type EmissionCauseItem = {
  rank: number;
  label: string;
  percentChange: number;
};

export type MonthOverMonthMetric = {
  label: string;
  icon: ComponentType<{ className?: string }>;
  iconColorClass: string;
  unit: string;
  previousValue: number;
  currentValue: number;
  percentChange: number;
  isIncrease: boolean;
  accentBorderClass: string;
  accentTextClass: string;
  accentBgClass: string;
};

export type SimulationOption = {
  degrees: number;
  projectedTons: number;
  percentChange: number;
};

export type AiSummaryPart = {
  text: string;
  emphasis?: boolean;
};

export type GoalProgress = {
  currentTons: number;
  targetTons: number;
  progressPercent: number;
};

export type GradeBand = {
  grade: string;
  minTons: number;
  maxTons: number;
  colorClass: string;
};

export type AiEvidenceBullet = {
  text: string;
  isPositive: boolean;
};

export type EmissionTreeNode = {
  id: string;
  label: string;
  percentage: number;
  children?: EmissionTreeNode[];
};

export type TrendScenario = {
  label: string;
  months: number;
  projectedTons: number;
  projectedGrade: string;
  projectedGradeColorClass: string;
  isWarning: boolean;
};

export type CostSavings = {
  label: string;
  unitLabel: string;
  currentAnnualCostLabel: string;
  projectedAnnualCostLabel: string;
  annualSavingsLabel: string;
};

export type DiagnosisReportData = {
  annualCo2Tons: number;
  grade: string;
  gradeColorClass: string;
  comparisonLabel: string;
  comparisonPercent: number;
  nationalAverageTons: number;
  industryAverageTons: number;
  ourUsageTons: number;
  zScore: number;
  percentile: number;
  percentileMessage: string;
  gradeBands: GradeBand[];
  emissionTree: EmissionTreeNode;
  emissionCauses: EmissionCauseItem[];
  aiEvidenceBullets: AiEvidenceBullet[];
  monthOverMonth: MonthOverMonthMetric[];
  trendScenarios: TrendScenario[];
  simulationLabel: string;
  simulationOptions: SimulationOption[];
  energyBreakdown: EnergyBreakdownItem[];
  esgStatusLabel: string;
  esgScores: EsgScoreItem[];
  aiSummary: AiSummaryPart[];
  goal: GoalProgress;
  costSavings: CostSavings;
};

const GRADE_BANDS: GradeBand[] = [
  { grade: "A", minTons: 0, maxTons: 1.5, colorClass: "bg-[#1ba77d]" },
  { grade: "B", minTons: 1.5, maxTons: 2.3, colorClass: "bg-[#7bc9a6]" },
  { grade: "C", minTons: 2.3, maxTons: 3.0, colorClass: "bg-[#e0a23a]" },
  { grade: "D", minTons: 3.0, maxTons: 4.0, colorClass: "bg-[#d9764a]" },
];

// 백엔드 src/common/grade.ts의 getGradeForKg와 동일한 임계값 — XGBoost가 돌려준
// 실제 배출량(톤)으로 등급을 매길 때 쓴다.
export function getGradeInfo(annualCo2Tons: number): {
  grade: string;
  gradeColorClass: string;
} {
  const band =
    GRADE_BANDS.find((candidate) => annualCo2Tons <= candidate.maxTons) ??
    GRADE_BANDS[GRADE_BANDS.length - 1];

  return { grade: band.grade, gradeColorClass: band.colorClass };
}

export const DUMMY_REPORT: DiagnosisReportData = {
  annualCo2Tons: 2.84,
  grade: "C",
  gradeColorClass: "bg-[#e0a23a]",
  comparisonLabel: "전국 소상공인 평균 대비",
  comparisonPercent: 32,
  nationalAverageTons: 2.15,
  industryAverageTons: 2.36,
  ourUsageTons: 2.84,
  zScore: 0.73,
  percentile: 23,
  percentileMessage: "동종업 상위 23%에 해당해요. 감축 액션이 필요해요.",
  gradeBands: GRADE_BANDS,
  emissionTree: {
    id: "root",
    label: "총 배출량",
    percentage: 100,
    children: [
      {
        id: "electricity",
        label: "전기",
        percentage: 69,
        children: [
          { id: "cooling", label: "냉방기기", percentage: 32 },
          { id: "lighting-etc", label: "조명·기타", percentage: 37 },
        ],
      },
      { id: "gas", label: "가스", percentage: 31 },
    ],
  },
  emissionCauses: [
    { rank: 1, label: "전기 사용량", percentChange: 42 },
    { rank: 2, label: "냉방기 사용", percentChange: 18 },
    { rank: 3, label: "가스 사용량", percentChange: 11 },
  ],
  aiEvidenceBullets: [
    { text: "동종업 평균보다 전기 사용량 27% 높음", isPositive: false },
    { text: "냉방 사용 비중 평균 대비 +18%", isPositive: false },
    { text: "가스 사용량은 평균 수준", isPositive: true },
  ],
  monthOverMonth: [
    {
      label: "전기",
      icon: BoltIcon,
      iconColorClass: "text-[#facc15]",
      unit: "kWh",
      previousValue: 306,
      currentValue: 330,
      percentChange: 7.9,
      isIncrease: true,
      accentBorderClass: "border-[#bfe9da]",
      accentTextClass: "text-[#1ba77d]",
      accentBgClass: "bg-[#1ba77d]",
    },
    {
      label: "탄소배출량",
      icon: SwirlIcon,
      iconColorClass: "text-[#6b7785]",
      unit: "tCO₂e",
      previousValue: 2.51,
      currentValue: 2.84,
      percentChange: 13,
      isIncrease: true,
      accentBorderClass: "border-[#f1c9a6]",
      accentTextClass: "text-[#e0a23a]",
      accentBgClass: "bg-[#e0a23a]",
    },
  ],
  simulationLabel: "에어컨 온도를 높이면",
  simulationOptions: [
    { degrees: 1, projectedTons: 2.7, percentChange: -4.9 },
    { degrees: 2, projectedTons: 2.56, percentChange: -9.8 },
    { degrees: 3, projectedTons: 2.42, percentChange: -14.7 },
  ],
  energyBreakdown: [
    {
      label: "전기",
      icon: BoltIcon,
      iconColorClass: "text-[#facc15]",
      co2Tons: 1.96,
      percentage: 69,
      barColorClass: "bg-[#1ba77d]",
    },
    {
      label: "가스",
      icon: FireIcon,
      iconColorClass: "text-[#e0763a]",
      co2Tons: 0.88,
      percentage: 31,
      barColorClass: "bg-[#e0a23a]",
    },
  ],
  esgStatusLabel: "개선 필요",
  esgScores: [
    { label: "환경(E)", score: 42, ringColorHex: "#1ba77d" },
    { label: "사회(S)", score: 68, ringColorHex: "#3b82f6" },
    { label: "거버넌스(G)", score: 55, ringColorHex: "#8b5cf6" },
  ],
  aiSummary: [
    { text: "전기 사용량이 탄소배출의 " },
    { text: "69%", emphasis: true },
    { text: "를 차지하고 있습니다. 냉방 설비 효율 개선만으로도 약 " },
    { text: "10%", emphasis: true },
    { text: "의 감축이 가능합니다." },
  ],
  goal: { currentTons: 2.84, targetTons: 2.5, progressPercent: 48 },
  trendScenarios: [
    {
      label: "현재 추세 유지 시",
      months: 3,
      projectedTons: 3.02,
      projectedGrade: "D",
      projectedGradeColorClass: "bg-[#d9764a]",
      isWarning: true,
    },
    {
      label: "추천 액션 적용 시",
      months: 3,
      projectedTons: 2.5,
      projectedGrade: "B",
      projectedGradeColorClass: "bg-[#1ba77d]",
      isWarning: false,
    },
  ],
  costSavings: {
    label: "예상 전기요금",
    unitLabel: "/ 년",
    currentAnnualCostLabel: "74만원",
    projectedAnnualCostLabel: "66만원",
    annualSavingsLabel: "연간 약 8만원 절감",
  },
};
