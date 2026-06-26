// Dummy reduction-action recommendations. Once a backend can return
// AI-generated, usage-specific recommendations, this should be replaced
// by a GET response instead of a static constant.
export type ActionDifficulty = "쉬움" | "중간" | "어려움";

export type ReductionAction = {
  icon: string;
  title: string;
  description: string;
  reductionKgPerYear: number;
  difficulty: ActionDifficulty;
  costLabel: string;
};

export const DUMMY_REDUCTION_ACTIONS: ReductionAction[] = [
  {
    icon: "💡",
    title: "LED 조명 전면 교체",
    description: "기존 형광등을 LED로 교체해 조명 전력 최대 60% 절감",
    reductionKgPerYear: 120,
    difficulty: "쉬움",
    costLabel: "50~150만원",
  },
  {
    icon: "🔌",
    title: "대기전력 차단기 설치",
    description: "영업 종료 후 일괄 차단으로 불필요한 전력 소비 방지",
    reductionKgPerYear: 85,
    difficulty: "쉬움",
    costLabel: "5~20만원",
  },
  {
    icon: "❄️",
    title: "인버터 에어컨 교체",
    description: "정속형 → 인버터 냉방기 교체로 냉방 효율 50% 향상",
    reductionKgPerYear: 340,
    difficulty: "중간",
    costLabel: "150~300만원",
  },
  {
    icon: "🖼️",
    title: "단열 필름 시공",
    description: "창문 단열 필름으로 냉난방 부하를 줄여 에너지 20% 절감",
    reductionKgPerYear: 190,
    difficulty: "중간",
    costLabel: "30~80만원",
  },
  {
    icon: "☀️",
    title: "재생에너지 REC 구매",
    description: "재생에너지 공급인증서 구매로 Scope 2 배출량 직접 상쇄",
    reductionKgPerYear: 560,
    difficulty: "어려움",
    costLabel: "협의 필요",
  },
  {
    icon: "📊",
    title: "에너지 모니터링 기기",
    description: "IoT 기기로 실시간 사용량 파악 및 이상 사용 즉시 알림",
    reductionKgPerYear: 75,
    difficulty: "쉬움",
    costLabel: "10~30만원",
  },
];
