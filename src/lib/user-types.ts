import { HeartIcon, HomeIcon, StoreIcon } from "@/components/icons";
import type { UserType } from "@/context/diagnosis-context";
import type { ComponentType } from "react";

export type UserTypeInfo = {
  icon: ComponentType<{ className?: string }>;
  heroDescription: string;
  services: string[];
  selectionLabel: string;
  selectionDescription: string;
  tags: string[];
};

export const USER_TYPE_INFO: Record<UserType, UserTypeInfo> = {
  소상공인: {
    icon: StoreIcon,
    heroDescription:
      "주소 및 전력 사용 패턴 분석 결과, 소상공인 사업장으로 분류되었어요.",
    services: ["업종 평균 비교", "사업장 맞춤 감축 액션", "소상공인 지원사업"],
    selectionLabel: "소상공인",
    selectionDescription: "가게, 음식점, 사무실 등 사업장을 운영해요",
    tags: ["업종 평균 비교", "사업장 맞춤 감축 액션", "소상공인 지원사업"],
  },
  일반가구: {
    icon: HomeIcon,
    heroDescription:
      "주소 및 전력 사용 패턴 분석 결과, 일반 가구로 분류되었어요.",
    services: ["가구 평균 비교", "생활 절약 중심 감축 액션", "가정 지원사업"],
    selectionLabel: "일반 가구",
    selectionDescription: "아파트, 주택 등에 거주하는 일반 가정이에요",
    tags: ["가구 평균 비교", "생활 절약 중심 감축 액션", "가정 지원사업"],
  },
  취약계층: {
    icon: HeartIcon,
    heroDescription:
      "주소 및 전력 사용 패턴 분석 결과, 에너지 취약계층으로 분류되었어요.",
    services: ["복지 중심 감축 액션", "에너지 바우처", "취약계층 지원사업"],
    selectionLabel: "기후 취약계층",
    selectionDescription: "에너지 복지 지원이 필요한 취약 가구예요",
    tags: ["복지 중심 감축 액션", "에너지 바우처", "취약계층 지원사업"],
  },
};
