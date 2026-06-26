import type { UserType } from "@/context/diagnosis-context";

export type UserTypeInfo = {
  icon: string;
  heroDescription: string;
  services: string[];
  selectionLabel: string;
  selectionDescription: string;
  tags: string[];
};

export const USER_TYPE_INFO: Record<UserType, UserTypeInfo> = {
  소상공인: {
    icon: "🏪",
    heroDescription:
      "주소 및 전력 사용 패턴 분석 결과, 소상공인 사업장으로 분류되었어요.",
    services: [
      "ESG 자가진단 리포트 제공",
      "소상공인 전용 지원사업 매칭",
      "업종별 탄소 감축 액션 추천",
    ],
    selectionLabel: "소상공인",
    selectionDescription: "가게, 음식점, 사무실 등 사업장을 운영해요",
    tags: ["ESG 자가진단 리포트", "소상공인 전용 지원사업", "업종별 감축 액션"],
  },
  일반가구: {
    icon: "🏠",
    heroDescription:
      "주소 및 전력 사용 패턴 분석 결과, 일반 가구로 분류되었어요.",
    services: [
      "가구 맞춤 에너지 절감 리포트 제공",
      "가구 대상 지원사업 매칭",
      "생활 속 탄소 감축 액션 추천",
    ],
    selectionLabel: "일반 가구",
    selectionDescription: "아파트, 주택 등에 거주하는 일반 가정이에요",
    tags: ["가구 탄소발자국 진단", "에너지 절감 팁", "가구용 지원사업"],
  },
  취약계층: {
    icon: "💚",
    heroDescription:
      "주소 및 전력 사용 패턴 분석 결과, 에너지 취약계층으로 분류되었어요.",
    services: [
      "에너지 바우처 등 복지 지원사업 매칭",
      "에너지 취약계층 진단 리포트 제공",
      "냉난방비 절감 액션 추천",
    ],
    selectionLabel: "기후 취약계층",
    selectionDescription: "에너지 복지 지원이 필요한 취약 가구예요",
    tags: ["취약계층 전용 지원사업", "에너지 바우처 안내", "무료 에너지 진단"],
  },
};
