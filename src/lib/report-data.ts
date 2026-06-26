// Dummy report content matching the current report design. Once the
// backend can return an AI-generated diagnosis, this should be replaced
// by a GET response instead of a static constant.
export type EnergyBreakdownItem = {
  label: string;
  icon: string;
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
  unit: string;
  previousValue: number;
  currentValue: number;
  percentChange: number;
  isIncrease: boolean;
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

export type GradePrediction = {
  currentGrade: string;
  currentGradeColorClass: string;
  projectedGrade: string;
  projectedGradeColorClass: string;
};

export type CostSavings = {
  label: string;
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
  percentileMessage: string;
  emissionCauses: EmissionCauseItem[];
  monthOverMonth: MonthOverMonthMetric[];
  simulationLabel: string;
  simulationOptions: SimulationOption[];
  energyBreakdown: EnergyBreakdownItem[];
  esgStatusLabel: string;
  esgScores: EsgScoreItem[];
  aiSummary: AiSummaryPart[];
  goal: GoalProgress;
  gradePrediction: GradePrediction;
  costSavings: CostSavings;
};

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
  percentileMessage: "동종업 상위 23%에 해당해요. 감축 액션이 필요해요.",
  emissionCauses: [
    { rank: 1, label: "전기 사용량", percentChange: 42 },
    { rank: 2, label: "냉방기 사용", percentChange: 18 },
    { rank: 3, label: "가스 사용량", percentChange: 11 },
  ],
  monthOverMonth: [
    {
      label: "전기",
      unit: "kWh",
      previousValue: 306,
      currentValue: 330,
      percentChange: 7.9,
      isIncrease: true,
    },
    {
      label: "탄소배출량",
      unit: "tCO₂e",
      previousValue: 2.51,
      currentValue: 2.84,
      percentChange: 13,
      isIncrease: true,
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
      icon: "⚡",
      co2Tons: 1.96,
      percentage: 69,
      barColorClass: "bg-[#1ba77d]",
    },
    {
      label: "가스",
      icon: "🔥",
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
  goal: {
    currentTons: 2.84,
    targetTons: 2.5,
    progressPercent: 48,
  },
  gradePrediction: {
    currentGrade: "C",
    currentGradeColorClass: "bg-[#e0a23a]",
    projectedGrade: "B",
    projectedGradeColorClass: "bg-[#1ba77d]",
  },
  costSavings: {
    label: "예상 전기요금",
    currentAnnualCostLabel: "74만원/년",
    projectedAnnualCostLabel: "66만원/년",
    annualSavingsLabel: "연간 약 8만원 절감",
  },
};
