// Dummy support-program matches. Once a backend can return real
// AI-matched government/agency programs, this should be replaced by a
// GET response instead of a static constant.
export type SupportProgram = {
  agency: string;
  agencyBadgeClass: string;
  matchPercent: number;
  title: string;
  amountLabel: string;
  amountColorClass: string;
  deadlineLabel: string;
  tags: string[];
  requiredDocs: string;
};

export const DUMMY_SUPPORT_PROGRAMS: SupportProgram[] = [
  {
    agency: "중소벤처기업부",
    agencyBadgeClass: "bg-[#e3edf7] text-[#3a5a82]",
    matchPercent: 98,
    title: "소상공인 에너지효율화 지원사업",
    amountLabel: "최대 300만원",
    amountColorClass: "text-[#13261f]",
    deadlineLabel: "접수 ~2025.08.31",
    tags: ["소상공인 전용", "설비 교체"],
    requiredDocs: "사업자등록증 · 고지서 3개월치 · 에너지진단 확인서",
  },
  {
    agency: "한국에너지공단",
    agencyBadgeClass: "bg-[#fbe7c8] text-[#9a5b1f]",
    matchPercent: 87,
    title: "노후 냉방설비 고효율 교체 지원",
    amountLabel: "최대 200만원",
    amountColorClass: "text-[#13261f]",
    deadlineLabel: "접수 ~2025.09.15",
    tags: ["에어컨 교체", "인버터"],
    requiredDocs: "사업자등록증 · 기존 설비 사진 · 견적서",
  },
  {
    agency: "서울특별시",
    agencyBadgeClass: "bg-[#ece3f7] text-[#6b4a9e]",
    matchPercent: 95,
    title: "에너지진단 무료 방문 서비스",
    amountLabel: "무료",
    amountColorClass: "text-[#1ba77d]",
    deadlineLabel: "접수 상시 접수",
    tags: ["무료", "서울시 전용"],
    requiredDocs: "신청서 · 사업자등록증",
  },
];
