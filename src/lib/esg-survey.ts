import { ShieldIcon, SproutIcon, UsersIcon } from "@/components/icons";
import type { ComponentType } from "react";

export type EsgCategory = "E" | "S" | "G";

export type EsgSurveyQuestion = {
  // 백엔드 GET /esg-questions가 주는 문항 code(예: "E-1-2") — 그대로
  // POST /xgboost-diagnose의 esg_answers 키로 다시 보내져야 해서 id로 쓴다.
  id: string;
  category: EsgCategory;
  categoryLabel: string;
  text: string;
  icon: ComponentType<{ className?: string }>;
};

export type EsgSurveyAnswers = Record<string, number>;

const CATEGORY_META: Record<
  EsgCategory,
  { label: string; icon: ComponentType<{ className?: string }> }
> = {
  E: { label: "환경 (E)", icon: SproutIcon },
  S: { label: "사회 (S)", icon: UsersIcon },
  G: { label: "거버넌스 (G)", icon: ShieldIcon },
};

export type RawEsgQuestionsByCategory = Record<
  EsgCategory,
  { code: string; question: string }[]
>;

// GET /esg-questions 응답({E:[{code,question}], S:[...], G:[...]})을
// EsgSurveySheet가 기대하는 평탄화된 문항 목록으로 바꾼다. 문항 자체에는
// 아이콘/카테고리 라벨이 없어 카테고리 단위로 고정 매핑한다.
export function toEsgSurveyQuestions(
  raw: RawEsgQuestionsByCategory,
): EsgSurveyQuestion[] {
  const categories: EsgCategory[] = ["E", "S", "G"];

  return categories.flatMap((category) =>
    raw[category].map((item) => ({
      id: item.code,
      category,
      categoryLabel: CATEGORY_META[category].label,
      text: item.question,
      icon: CATEGORY_META[category].icon,
    })),
  );
}
